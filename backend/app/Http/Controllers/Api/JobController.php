<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApplicationResource;
use App\Http\Resources\MovingJobResource;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use App\Models\MovingJobCustomerDetail;
use App\Models\User;
use App\Notifications\ContractAwarded;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class JobController extends Controller
{
    /** 案件一覧・検索（会員向け公開一覧）。顧客個人情報は含めない。 */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MovingJob::query()
            ->with('company')
            ->withCount('applications');

        // 検索条件
        if ($pref = $request->query('prefecture')) {
            $query->where('from_prefecture', $pref);
        }
        // キーワード（出発地・到着地・案件ID）
        if ($kw = trim((string) $request->query('keyword'))) {
            $query->where(function ($q) use ($kw) {
                $q->where('from_prefecture', 'like', "%{$kw}%")
                    ->orWhere('from_city', 'like', "%{$kw}%")
                    ->orWhere('to_prefecture', 'like', "%{$kw}%")
                    ->orWhere('to_city', 'like', "%{$kw}%");
                if (preg_match('/(\d{1,})\s*$/', $kw, $m)) {
                    $q->orWhere('id', (int) ltrim($m[1], '0') ?: 0);
                }
            });
        }
        // 荷物量 / 間取り
        if ($layout = trim((string) $request->query('layout'))) {
            $query->where('layout', 'like', "%{$layout}%");
        }
        if ($date = $request->query('date')) {
            $query->whereDate('moving_date', $date);
        }
        if ($from = $request->query('date_from')) {
            $query->whereDate('moving_date', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->whereDate('moving_date', '<=', $to);
        }
        // 公開一覧には成約済み・完了も「成約済み」と分かる形で掲載する（マーケットの透明性）。
        // ただしキャンセル案件のみは公開一覧に出さない。顧客個人情報は別テーブルで
        // 成約会社・掲載会社のみに限定（本メソッドでは一切含めない）。
        $public = [
            MovingJob::STATUS_RECRUITING,
            MovingJob::STATUS_CLOSED,
            MovingJob::STATUS_CONTRACTED,
            MovingJob::STATUS_COMPLETED,
        ];
        $status = $request->query('status');
        if ($status && in_array($status, $public, true)) {
            $query->where('status', $status);
        } else {
            $query->whereIn('status', $public);
        }

        // 並び順
        match ($request->query('sort', 'new')) {
            'old' => $query->oldest('created_at'),
            'deadline' => $query->orderByRaw('application_deadline IS NULL, application_deadline asc'),
            'applications' => $query->orderByDesc('applications_count')->latest('created_at'),
            'moving_asc' => $query->orderBy('moving_date', 'asc'),
            'moving_desc' => $query->orderByDesc('moving_date'),
            default => $query->latest('created_at'),
        };

        $jobs = $query->paginate(12)->withQueryString();

        // 自社の応募済み案件IDを付与（has_applied フラグ用）
        $appliedIds = JobApplication::where('company_id', $user->company_id)
            ->pluck('moving_job_id')->flip();
        $jobs->getCollection()->transform(function (MovingJob $job) use ($appliedIds) {
            $job->has_applied = $appliedIds->has($job->id);
            $job->canViewCustomer = false;
            return $job;
        });

        return MovingJobResource::collection($jobs)->response();
    }

    /** 案件詳細。顧客情報は「成約済み」かつ「成約会社」の場合のみ含める。 */
    public function show(Request $request, MovingJob $job): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $isOwner = $job->company_id === $companyId;
        $isWinner = in_array($job->status, [MovingJob::STATUS_CONTRACTED, MovingJob::STATUS_COMPLETED], true)
            && JobContract::where('moving_job_id', $job->id)
                ->where('winning_company_id', $companyId)->exists();

        // 成約済み・完了は会員なら閲覧可（一覧に「成約済み」と表示するため）。
        // 顧客個人情報は下の canViewCustomer で成約会社・掲載会社のみに限定。
        // キャンセル案件だけは掲載会社以外に見せない（公開一覧にも出さない案件）。
        if ($job->status === MovingJob::STATUS_CANCELLED && ! $isOwner) {
            abort(403, 'この案件は現在閲覧できません。');
        }

        $job->load('company', 'media')->loadCount('applications');

        $canViewCustomer = $this->canViewCustomer($job, $companyId);
        if ($canViewCustomer) {
            $job->load('customerDetail');
        }
        $job->canViewCustomer = $canViewCustomer;
        $job->has_applied = JobApplication::where('moving_job_id', $job->id)
            ->where('company_id', $companyId)->exists();
        $job->is_winner = $isWinner;

        return (new MovingJobResource($job))->response();
    }

    /** 案件投稿（発注）。顧客情報は別テーブルに保存し、公開されない。 */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'moving_date' => ['required', 'date'],
            'time_slot' => ['nullable', 'string', 'max:50'],
            'from_prefecture' => ['required', 'string', 'max:20'],
            'from_city' => ['nullable', 'string', 'max:100'],
            'to_prefecture' => ['required', 'string', 'max:20'],
            'to_city' => ['nullable', 'string', 'max:100'],
            'building_type' => ['required', 'string', 'max:50'],
            'layout' => ['nullable', 'string', 'max:50'],
            'luggage_volume' => ['required', 'string', 'max:100'],
            'truck_size' => ['nullable', 'string', 'max:50'],
            'worker_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'floors' => ['nullable', 'string', 'max:50'],
            'has_elevator' => ['nullable', 'boolean'],
            'desired_price' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:2000'],
            'application_deadline' => ['required', 'date', 'after:now'],
            // 顧客情報（任意入力。投稿時に保持し、成約後に成約会社へ開示）
            'customer_name' => ['nullable', 'string', 'max:100'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_address' => ['nullable', 'string', 'max:255'],
            'contact_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $job = DB::transaction(function () use ($data, $user) {
            $job = MovingJob::create([
                'company_id' => $user->company_id,
                'status' => MovingJob::STATUS_RECRUITING,
                ...collect($data)->except(['customer_name', 'customer_phone', 'customer_address', 'contact_note'])->all(),
            ]);

            if (! empty($data['customer_name'])) {
                MovingJobCustomerDetail::create([
                    'moving_job_id' => $job->id,
                    'customer_name' => $data['customer_name'],
                    'customer_phone' => $data['customer_phone'] ?? '',
                    'customer_address' => $data['customer_address'] ?? '',
                    'contact_note' => $data['contact_note'] ?? null,
                ]);
            }

            return $job;
        });

        $job->load('company')->loadCount('applications');
        $job->canViewCustomer = true; // 掲載会社は自案件の顧客情報を閲覧可
        $job->load('customerDetail');

        return (new MovingJobResource($job))->response()->setStatusCode(201);
    }

    /** 案件の編集（発注会社・募集中のみ）。顧客情報も更新可能。 */
    public function update(Request $request, MovingJob $job): JsonResponse
    {
        $this->authorizeOwner($request, $job);

        if ($job->status !== MovingJob::STATUS_RECRUITING) {
            throw ValidationException::withMessages(['status' => ['募集中の案件のみ編集できます。']]);
        }

        $data = $request->validate([
            'moving_date' => ['required', 'date'],
            'time_slot' => ['nullable', 'string', 'max:50'],
            'from_prefecture' => ['required', 'string', 'max:20'],
            'from_city' => ['nullable', 'string', 'max:100'],
            'to_prefecture' => ['required', 'string', 'max:20'],
            'to_city' => ['nullable', 'string', 'max:100'],
            'building_type' => ['required', 'string', 'max:50'],
            'layout' => ['nullable', 'string', 'max:50'],
            'luggage_volume' => ['required', 'string', 'max:100'],
            'truck_size' => ['nullable', 'string', 'max:50'],
            'worker_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'floors' => ['nullable', 'string', 'max:50'],
            'has_elevator' => ['nullable', 'boolean'],
            'desired_price' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:2000'],
            'application_deadline' => ['required', 'date', 'after:now'],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_address' => ['nullable', 'string', 'max:255'],
            'contact_note' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($job, $data) {
            $job->update(collect($data)->except(['customer_name', 'customer_phone', 'customer_address', 'contact_note'])->all());

            if (! empty($data['customer_name'])) {
                MovingJobCustomerDetail::updateOrCreate(
                    ['moving_job_id' => $job->id],
                    [
                        'customer_name' => $data['customer_name'],
                        'customer_phone' => $data['customer_phone'] ?? '',
                        'customer_address' => $data['customer_address'] ?? '',
                        'contact_note' => $data['contact_note'] ?? null,
                    ]
                );
            } else {
                MovingJobCustomerDetail::where('moving_job_id', $job->id)->delete();
            }
        });

        activity('operation')->causedBy($request->user())->performedOn($job)->event('updated')->log('案件を編集');

        $job->load('company')->loadCount('applications');
        $job->canViewCustomer = true;
        $job->load('customerDetail');

        return (new MovingJobResource($job))->response();
    }

    /** 自社が掲載した案件一覧（?status で絞り込み） */
    public function myPosted(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = MovingJob::where('company_id', $user->company_id)
            ->with('company')
            ->withCount('applications')
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $jobs = $query->paginate(12);
        $jobs->getCollection()->transform(function (MovingJob $job) {
            $job->canViewCustomer = false;
            return $job;
        });

        return MovingJobResource::collection($jobs)->response();
    }

    /** 自社が成約した（受注側）案件一覧 */
    public function myContracts(Request $request): JsonResponse
    {
        $user = $request->user();
        $jobIds = JobContract::where('winning_company_id', $user->company_id)->pluck('moving_job_id');

        $jobs = MovingJob::whereIn('id', $jobIds)
            ->with('company', 'contract')
            ->latest('id')
            ->paginate(12);

        $jobs->getCollection()->transform(function (MovingJob $job) {
            $job->canViewCustomer = false;
            return $job;
        });

        return MovingJobResource::collection($jobs)->response();
    }

    /** 自社案件への応募一覧（発注側が応募会社を確認） */
    public function applications(Request $request, MovingJob $job): JsonResponse
    {
        $this->authorizeOwner($request, $job);

        $applications = $job->applications()
            ->with(['company', 'applicant'])
            ->latest()
            ->get();

        return ApplicationResource::collection($applications)->response();
    }

    /** 成約：発注会社が1応募を選択（募集終了・他社閲覧不可・顧客情報を成約会社へ開示） */
    public function decide(Request $request, MovingJob $job): JsonResponse
    {
        $this->authorizeOwner($request, $job);

        if ($job->status !== MovingJob::STATUS_RECRUITING && $job->status !== MovingJob::STATUS_CLOSED) {
            throw ValidationException::withMessages(['status' => ['この案件は成約処理できません。']]);
        }

        $data = $request->validate([
            'application_id' => [
                'required',
                Rule::exists('job_applications', 'id')->where('moving_job_id', $job->id),
            ],
        ]);

        $winningCompanyId = DB::transaction(function () use ($job, $data) {
            $winning = JobApplication::where('id', $data['application_id'])->firstOrFail();

            JobApplication::where('moving_job_id', $job->id)
                ->where('id', '!=', $winning->id)
                ->update(['status' => JobApplication::STATUS_REJECTED]);
            $winning->update(['status' => JobApplication::STATUS_ACCEPTED]);

            $job->update(['status' => MovingJob::STATUS_CONTRACTED]);

            JobContract::updateOrCreate(
                ['moving_job_id' => $job->id],
                [
                    'job_application_id' => $winning->id,
                    'winning_company_id' => $winning->company_id,
                    'contracted_at' => now(),
                ]
            );

            return $winning->company_id;
        });

        // 成約会社（受注側）の担当者へ成約通知（メール失敗は業務処理を止めない）
        try {
            $recipients = User::where('company_id', $winningCompanyId)->where('is_active', true)->get();
            Notification::send($recipients, new ContractAwarded($job));
        } catch (\Throwable $e) {
            report($e);
        }

        activity('operation')->causedBy($request->user())->performedOn($job)->event('contracted')->log('成約を決定');

        return response()->json(['message' => '成約処理が完了しました。']);
    }

    /** 完了登録 */
    public function complete(Request $request, MovingJob $job): JsonResponse
    {
        $this->authorizeOwner($request, $job);
        if ($job->status !== MovingJob::STATUS_CONTRACTED) {
            throw ValidationException::withMessages(['status' => ['成約済みの案件のみ完了登録できます。']]);
        }
        $job->update(['status' => MovingJob::STATUS_COMPLETED]);
        activity('operation')->causedBy($request->user())->performedOn($job)->event('completed')->log('案件を完了登録');

        return response()->json(['message' => '案件を完了にしました。']);
    }

    /** キャンセル登録 */
    public function cancel(Request $request, MovingJob $job): JsonResponse
    {
        $this->authorizeOwner($request, $job);
        if (in_array($job->status, [MovingJob::STATUS_COMPLETED, MovingJob::STATUS_CANCELLED], true)) {
            throw ValidationException::withMessages(['status' => ['この案件はキャンセルできません。']]);
        }
        $job->update(['status' => MovingJob::STATUS_CANCELLED]);
        activity('operation')->causedBy($request->user())->performedOn($job)->event('cancelled')->log('案件をキャンセル');

        return response()->json(['message' => '案件をキャンセルしました。']);
    }

    /** 添付ファイル（画像・PDF）アップロード。掲載会社のみ、1案件あたり合計3ファイルまで。 */
    public function uploadAttachments(Request $request, MovingJob $job): JsonResponse
    {
        $this->authorizeOwner($request, $job);

        $request->validate([
            'files' => ['required', 'array', 'max:3'],
            'files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,pdf', 'max:10240'], // 10MB
        ]);

        $existing = $job->getMedia('attachments')->count();
        $incoming = count($request->file('files'));
        if ($existing + $incoming > 3) {
            throw ValidationException::withMessages(['files' => ['添付は1案件あたり合計3ファイルまでです。']]);
        }

        foreach ($request->file('files') as $file) {
            $job->addMedia($file)->toMediaCollection('attachments');
        }

        return response()->json(['message' => '添付ファイルをアップロードしました。']);
    }

    /** 顧客情報の閲覧可否：成約済み かつ 成約会社 のみ true */
    private function canViewCustomer(MovingJob $job, ?int $companyId): bool
    {
        if (! $companyId) {
            return false;
        }
        // 掲載会社は自案件の顧客情報を閲覧可
        if ($job->company_id === $companyId) {
            return true;
        }
        // 成約会社は成約後に閲覧可
        if ($job->status === MovingJob::STATUS_CONTRACTED || $job->status === MovingJob::STATUS_COMPLETED) {
            return JobContract::where('moving_job_id', $job->id)
                ->where('winning_company_id', $companyId)->exists();
        }

        return false;
    }

    private function authorizeOwner(Request $request, MovingJob $job): void
    {
        if ($job->company_id !== $request->user()->company_id) {
            abort(403, 'この案件を操作する権限がありません。');
        }
    }
}
