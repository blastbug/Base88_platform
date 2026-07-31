<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyDocument;
use App\Models\CompanyVehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/**
 * 加盟店による登録情報（10セクション）の自己入力API。
 * 会社情報・代表者・担当者・会社規模・保有車両・許可/書類・会社実績・保険・
 * 保有資材・対応サービスを加盟店自身が入力し、審査へ申請できる。
 */
class CompanyProfileController extends Controller
{
    /** 車両区分の候補（フロントと共有） */
    public const TRUCK_SIZES = [
        '軽トラック', '1トントラック', '2トンショート', '2トンロング', '2トンワイド', '3トントラック', '4トントラック', 'その他',
    ];

    /** 登録情報の取得（自社） */
    public function show(Request $request): JsonResponse
    {
        $company = $request->user()->company;
        abort_if(! $company, 404);
        $company->loadMissing('vehicles', 'documents');

        return response()->json(['data' => $this->payload($company)]);
    }

    /** 登録情報の更新（自社・会社管理者のみ）。保有車両は同期。 */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;
        abort_if(! $company, 404);
        abort_unless($user->isCompanyAdmin(), 403, '登録情報を編集する権限がありません。');

        $data = $request->validate($this->rules());

        $company->fill(Arr::except($data, ['vehicles']));
        $company->save();

        // 保有車両は総入れ替えで同期
        if (array_key_exists('vehicles', $data)) {
            $company->vehicles()->delete();
            foreach ($data['vehicles'] as $v) {
                $company->vehicles()->create(Arr::only($v, [
                    'vehicle_type', 'truck_size', 'count', 'max_load', 'plate_number', 'ownership', 'availability',
                ]));
            }
        }

        return response()->json(['message' => '登録情報を保存しました。', 'data' => $this->payload($company->fresh(['vehicles', 'documents']))]);
    }

    /** 書類（許可証・本人確認・保険証券）のアップロード */
    public function uploadDocument(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;
        abort_if(! $company, 404);
        abort_unless($user->isCompanyAdmin(), 403, '書類を登録する権限がありません。');

        $data = $request->validate([
            'doc_type' => ['required', 'string', 'in:' . implode(',', array_keys(CompanyDocument::TYPES))],
            'doc_name' => ['nullable', 'string', 'max:255'],
            'permit_number' => ['nullable', 'string', 'max:100'],
            'expiry_date' => ['nullable', 'date'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
        ]);

        $path = $request->hasFile('file') ? $request->file('file')->store('company-documents', 'public') : null;

        $doc = $company->documents()->create([
            'doc_type' => $data['doc_type'],
            'doc_name' => $data['doc_name'] ?? null,
            'permit_number' => $data['permit_number'] ?? null,
            'expiry_date' => $data['expiry_date'] ?? null,
            'file_path' => $path,
            'review_status' => CompanyDocument::REVIEW_PENDING,
        ]);

        return response()->json(['message' => '書類をアップロードしました。', 'data' => $this->documentPayload($doc)], 201);
    }

    /** 書類の削除（自社・確認済みは削除不可） */
    public function deleteDocument(Request $request, CompanyDocument $document): JsonResponse
    {
        $user = $request->user();
        abort_unless($document->company_id === $user->company_id, 403, '他社の書類は削除できません。');
        abort_unless($user->isCompanyAdmin(), 403, '書類を削除する権限がありません。');
        if ($document->review_status === CompanyDocument::REVIEW_CONFIRMED) {
            return response()->json(['message' => '確認済みの書類は削除できません。'], 422);
        }
        $document->delete();

        return response()->json(['message' => '書類を削除しました。']);
    }

    /** 審査へ申請（入力途中／修正依頼 → 申請済み） */
    public function submit(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;
        abort_if(! $company, 404);
        abort_unless($user->isCompanyAdmin(), 403, '申請を行う権限がありません。');

        if (! in_array($company->review_status, [Company::REVIEW_DRAFT, Company::REVIEW_REVISION], true)) {
            return response()->json(['message' => '現在、申請できる状態ではありません。'], 422);
        }
        if (blank($company->name)) {
            return response()->json(['message' => '会社名は必須です。入力のうえ申請してください。'], 422);
        }

        $company->update([
            'review_status' => Company::REVIEW_SUBMITTED,
            'review_note' => null,
            'submitted_at' => now(),
        ]);
        activity('operation')->causedBy($user)->performedOn($company)->event('submitted')->log('加盟店が登録情報を申請');

        return response()->json(['message' => '審査を申請しました。BASE88による審査をお待ちください。']);
    }

    /** 加盟店が編集できるフィールドのバリデーション */
    private function rules(): array
    {
        return [
            // 1. 会社情報
            'name' => ['required', 'string', 'max:255'],
            'name_kana' => ['nullable', 'string', 'max:255'],
            'corporate_number' => ['nullable', 'string', 'max:20'],
            'invoice_number' => ['nullable', 'string', 'max:20'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'established_ym' => ['nullable', 'string', 'max:7'],
            'website' => ['nullable', 'string', 'max:255'],
            'service_areas' => ['nullable', 'string', 'max:500'],
            'business_hours' => ['nullable', 'string', 'max:100'],
            'holidays' => ['nullable', 'string', 'max:100'],
            // 2. 代表者
            'rep_name' => ['nullable', 'string', 'max:100'],
            'rep_name_kana' => ['nullable', 'string', 'max:100'],
            'rep_birthday' => ['nullable', 'date'],
            'rep_address' => ['nullable', 'string', 'max:255'],
            'rep_phone' => ['nullable', 'string', 'max:30'],
            'rep_email' => ['nullable', 'email', 'max:255'],
            // 3. 担当者
            'contact_name' => ['nullable', 'string', 'max:100'],
            'contact_department' => ['nullable', 'string', 'max:100'],
            'contact_title' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            // 4. 会社規模
            'employee_count' => ['nullable', 'integer', 'min:0'],
            'worker_count' => ['nullable', 'integer', 'min:0'],
            'sales_staff_count' => ['nullable', 'integer', 'min:0'],
            'vehicle_count' => ['nullable', 'integer', 'min:0'],
            // 6. 許可
            'has_antique_license' => ['nullable', 'boolean'],
            'has_light_cargo_license' => ['nullable', 'boolean'],
            'has_general_cargo_license' => ['nullable', 'boolean'],
            // 7. 会社実績
            'experience_years' => ['nullable', 'integer', 'min:0'],
            'annual_jobs' => ['nullable', 'integer', 'min:0'],
            'monthly_capacity' => ['nullable', 'integer', 'min:0'],
            'corporate_experience' => ['nullable', 'boolean'],
            'individual_experience' => ['nullable', 'boolean'],
            'long_distance_support' => ['nullable', 'boolean'],
            'peak_capacity' => ['nullable', 'integer', 'min:0'],
            'main_clients' => ['nullable', 'string', 'max:1000'],
            'achievements' => ['nullable', 'string', 'max:2000'],
            // 8. 保険
            'has_transport_insurance' => ['nullable', 'boolean'],
            'has_cargo_insurance' => ['nullable', 'boolean'],
            'has_liability_insurance' => ['nullable', 'boolean'],
            'has_auto_insurance' => ['nullable', 'boolean'],
            'insurer_name' => ['nullable', 'string', 'max:255'],
            'policy_number' => ['nullable', 'string', 'max:100'],
            'coverage_amount' => ['nullable', 'integer', 'min:0'],
            'insurance_expiry' => ['nullable', 'date'],
            // 9. 保有資材
            'material_hanger_box' => ['nullable', 'integer', 'min:0'],
            'material_futon_bag' => ['nullable', 'integer', 'min:0'],
            'material_mattress_cover' => ['nullable', 'integer', 'min:0'],
            'material_plastic_sheet' => ['nullable', 'integer', 'min:0'],
            'material_floor_board_m' => ['nullable', 'integer', 'min:0'],
            // 10. 対応サービス
            'svc_disposal_pickup' => ['nullable', 'boolean'],
            'svc_disposal_buy' => ['nullable', 'boolean'],
            'svc_ac_install' => ['nullable', 'boolean'],
            'svc_washer_install' => ['nullable', 'boolean'],
            'svc_furniture_assembly' => ['nullable', 'boolean'],
            'svc_appliance_install' => ['nullable', 'boolean'],
            'svc_packing' => ['nullable', 'boolean'],
            'svc_unpacking' => ['nullable', 'boolean'],
            'svc_protection' => ['nullable', 'boolean'],
            'svc_long_distance' => ['nullable', 'boolean'],
            'svc_storage' => ['nullable', 'boolean'],
            // 5. 保有車両
            'vehicles' => ['nullable', 'array'],
            'vehicles.*.vehicle_type' => ['nullable', 'string', 'max:100'],
            'vehicles.*.truck_size' => ['nullable', 'string', 'max:100'],
            'vehicles.*.count' => ['nullable', 'integer', 'min:0'],
            'vehicles.*.max_load' => ['nullable', 'string', 'max:100'],
            'vehicles.*.plate_number' => ['nullable', 'string', 'max:100'],
            'vehicles.*.ownership' => ['nullable', 'string', 'max:50'],
            'vehicles.*.availability' => ['nullable', 'string', 'max:100'],
        ];
    }

    private function payload(Company $c): array
    {
        $fields = array_keys($this->rules());
        $out = [];
        foreach ($fields as $f) {
            if (str_contains($f, '.') || $f === 'vehicles') {
                continue;
            }
            $out[$f] = $c->{$f};
        }
        $out['rep_birthday'] = optional($c->rep_birthday)->toDateString();
        $out['insurance_expiry'] = optional($c->insurance_expiry)->toDateString();
        $out['review_status'] = $c->review_status;
        $out['review_status_label'] = $c->reviewStatusLabel();
        $out['review_note'] = $c->review_note;
        $out['is_approved'] = $c->isApproved();
        $out['can_edit'] = ! in_array($c->review_status, [Company::REVIEW_SUSPENDED, Company::REVIEW_TERMINATED], true);
        $out['can_submit'] = in_array($c->review_status, [Company::REVIEW_DRAFT, Company::REVIEW_REVISION], true);
        $out['vehicles'] = $c->vehicles->map(fn (CompanyVehicle $v) => [
            'id' => $v->id,
            'vehicle_type' => $v->vehicle_type,
            'truck_size' => $v->truck_size,
            'count' => $v->count,
            'max_load' => $v->max_load,
            'plate_number' => $v->plate_number,
            'ownership' => $v->ownership,
            'availability' => $v->availability,
        ])->values();
        $out['documents'] = $c->documents->map(fn (CompanyDocument $d) => $this->documentPayload($d))->values();
        $out['truck_sizes'] = self::TRUCK_SIZES;
        $out['document_types'] = CompanyDocument::TYPES;

        return $out;
    }

    private function documentPayload(CompanyDocument $d): array
    {
        $reviewLabels = [
            CompanyDocument::REVIEW_PENDING => '確認待ち',
            CompanyDocument::REVIEW_CONFIRMED => '確認済み',
            CompanyDocument::REVIEW_REJECTED => '差し戻し',
        ];

        return [
            'id' => $d->id,
            'doc_type' => $d->doc_type,
            'doc_type_label' => $d->typeLabel(),
            'doc_name' => $d->doc_name,
            'permit_number' => $d->permit_number,
            'expiry_date' => optional($d->expiry_date)->toDateString(),
            'file_url' => $d->file_path ? '/storage/' . $d->file_path : null,
            'review_status' => $d->review_status,
            'review_status_label' => $reviewLabels[$d->review_status] ?? $d->review_status,
            'reject_reason' => $d->reject_reason,
        ];
    }
}
