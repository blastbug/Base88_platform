<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyInvoice;
use App\Models\JobFinance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 加盟店側の売上・精算・請求書API。
 * 代行集金額・追加料金の入力、請求書アップロード、月別売上の確認を提供する。
 */
class SalesController extends Controller
{
    /** 売上・精算の一覧（成約案件ごと）＋月別サマリー＋請求書一覧 */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        abort_if(! $companyId, 404);

        $finances = JobFinance::with('contract.movingJob')
            ->where('company_id', $companyId)
            ->get()
            ->sortByDesc(fn ($f) => optional($f->settled_month)->timestamp)
            ->values();

        // 月別サマリー
        $monthly = $finances
            ->groupBy(fn ($f) => optional($f->settled_month)->format('Y-m') ?? '未設定')
            ->map(function ($group, $ym) {
                return [
                    'month' => $ym,
                    'count' => $group->count(),
                    'sales' => (int) $group->sum('sale_amount'),
                    'collected' => (int) $group->sum('collected_amount'),
                    'additional' => (int) $group->sum('additional_amount'),
                    'billing' => (int) $group->sum('billing_amount'),
                    'payment' => (int) $group->sum('payment_amount'),
                    'remit' => (int) $group->sum(fn ($f) => $f->remit_amount),
                ];
            })
            ->sortKeysDesc()
            ->values();

        return response()->json([
            'monthly' => $monthly,
            'finances' => $finances->map(fn (JobFinance $f) => $this->financePayload($f)),
            'invoices' => CompanyInvoice::where('company_id', $companyId)
                ->orderByDesc('target_month')->orderByDesc('id')->get()
                ->map(fn (CompanyInvoice $i) => $this->invoicePayload($i)),
        ]);
    }

    /** 代行集金額・追加料金の入力（自社の精算のみ・確認/金額確定は管理者側） */
    public function updateFinance(Request $request, JobFinance $finance): JsonResponse
    {
        abort_unless($finance->company_id === $request->user()->company_id, 403, '他社の精算は編集できません。');

        $data = $request->validate([
            'collected_amount' => ['nullable', 'integer', 'min:0'],
            'additional_amount' => ['nullable', 'integer', 'min:0'],
            'additional_detail' => ['nullable', 'string', 'max:255'],
            'additional_reason' => ['nullable', 'string', 'max:255'],
            'additional_note' => ['nullable', 'string', 'max:500'],
        ]);
        if (array_key_exists('additional_amount', $data) && $data['additional_amount']) {
            $data['additional_input_date'] = now()->toDateString();
        }
        $finance->update($data);

        return response()->json(['message' => '代行集金額・追加料金を保存しました。', 'data' => $this->financePayload($finance->fresh())]);
    }

    /** 月次請求書のアップロード */
    public function uploadInvoice(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        abort_if(! $companyId, 404);

        $data = $request->validate([
            'target_month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'amount' => ['required', 'integer', 'min:0'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
        ]);

        $path = $request->hasFile('file')
            ? $request->file('file')->store('company-invoices', 'public')
            : null;

        $invoice = CompanyInvoice::create([
            'company_id' => $companyId,
            'target_month' => $data['target_month'],
            'amount' => $data['amount'],
            'file_path' => $path,
            'uploaded_at' => now(),
            'review_status' => CompanyInvoice::REVIEW_PENDING,
            'payment_status' => CompanyInvoice::PAY_UNPAID,
        ]);

        return response()->json(['message' => '請求書をアップロードしました。', 'data' => $this->invoicePayload($invoice)], 201);
    }

    private function financePayload(JobFinance $f): array
    {
        $job = $f->contract?->movingJob;

        return [
            'id' => $f->id,
            'job_code' => $job?->job_code,
            'moving_date' => optional($job?->moving_date)->toDateString(),
            'route' => $job ? ($job->from_prefecture . ' → ' . $job->to_prefecture) : null,
            'settled_month' => optional($f->settled_month)->format('Y-m'),
            'sale_amount' => $f->sale_amount,
            'collected_amount' => $f->collected_amount,
            'collection_fee_rate' => (float) $f->collection_fee_rate,
            'collection_fee' => $f->collection_fee,
            'remit_amount' => $f->remit_amount,
            'collection_confirmed' => (bool) $f->collection_confirmed,
            'additional_amount' => $f->additional_amount,
            'additional_detail' => $f->additional_detail,
            'additional_reason' => $f->additional_reason,
            'additional_note' => $f->additional_note,
            'additional_confirmed' => (bool) $f->additional_confirmed,
            'billing_amount' => $f->billing_amount,
            'payment_amount' => $f->payment_amount,
            'deposit_status' => $f->deposit_status,
            'payment_status' => $f->payment_status,
        ];
    }

    private function invoicePayload(CompanyInvoice $i): array
    {
        return [
            'id' => $i->id,
            'target_month' => $i->target_month,
            'amount' => $i->amount,
            'file_url' => $i->file_path ? '/storage/' . $i->file_path : null,
            'uploaded_at' => optional($i->uploaded_at)->toIso8601String(),
            'review_status' => $i->review_status,
            'review_status_label' => $i->reviewLabel(),
            'reject_reason' => $i->reject_reason,
            'payment_status' => $i->payment_status,
            'paid_at' => optional($i->paid_at)->toDateString(),
        ];
    }
}
