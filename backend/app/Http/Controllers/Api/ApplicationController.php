<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApplicationResource;
use App\Models\JobApplication;
use App\Models\MovingJob;
use App\Notifications\JobApplied;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class ApplicationController extends Controller
{
    /** 案件へ応募（受注側）。自社案件応募禁止・二重応募防止・締切/募集状況をチェック。 */
    public function store(Request $request, MovingJob $job): JsonResponse
    {
        $user = $request->user();

        // 自社案件への応募禁止
        if ($job->company_id === $user->company_id) {
            throw ValidationException::withMessages(['job' => ['自社が掲載した案件には応募できません。']]);
        }

        // 募集中のみ応募可
        if ($job->status !== MovingJob::STATUS_RECRUITING) {
            throw ValidationException::withMessages(['job' => ['この案件は募集を終了しています。']]);
        }

        // 締切超過
        if ($job->application_deadline && $job->application_deadline->isPast()) {
            throw ValidationException::withMessages(['job' => ['この案件は応募締切を過ぎています。']]);
        }

        // 二重応募防止
        $exists = JobApplication::where('moving_job_id', $job->id)
            ->where('company_id', $user->company_id)->exists();
        if ($exists) {
            throw ValidationException::withMessages(['job' => ['この案件には既に応募済みです。']]);
        }

        $data = $request->validate([
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $application = JobApplication::create([
            'moving_job_id' => $job->id,
            'company_id' => $user->company_id,
            'applied_by' => $user->id,
            'message' => $data['message'] ?? null,
            'status' => JobApplication::STATUS_APPLIED,
        ]);

        $application->load(['company', 'applicant']);

        // 掲載（発注）会社の担当者へ応募通知（メール失敗は業務処理を止めない）
        try {
            $recipients = $job->company->users()->where('is_active', true)->get();
            Notification::send($recipients, new JobApplied($job, $application));
        } catch (\Throwable $e) {
            report($e);
        }

        return (new ApplicationResource($application))->response()->setStatusCode(201);
    }

    /** 自社の応募履歴（受注側） */
    public function myApplications(Request $request): JsonResponse
    {
        $user = $request->user();

        // タブ（応募中／成約済み／不成立）でクライアント側分類するため、
        // 十分な件数をまとめて返す（テスト運用規模を想定）。
        $applications = JobApplication::where('company_id', $user->company_id)
            ->with(['movingJob.company'])
            ->latest()
            ->paginate(50);

        return ApplicationResource::collection($applications)->response();
    }
}
