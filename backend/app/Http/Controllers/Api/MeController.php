<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\StaffInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MeController extends Controller
{
    /** 自社（会社）情報 */
    public function company(Request $request): JsonResponse
    {
        $company = $request->user()->company;
        if (! $company) {
            return response()->json(['data' => null]);
        }

        $company->loadMissing('documents');

        // 差し戻し（要再提出）の書類
        $rejectedDocs = $company->documents
            ->where('review_status', \App\Models\CompanyDocument::REVIEW_REJECTED)
            ->map(fn ($d) => [
                'id' => $d->id,
                'type' => $d->typeLabel(),
                'name' => $d->doc_name,
                'reason' => $d->reject_reason,
            ])->values();

        return response()->json(['data' => [
            'id' => $company->id,
            'name' => $company->name,
            'name_kana' => $company->name_kana,
            'address' => $company->address,
            'postal_code' => $company->postal_code,
            'phone' => $company->phone,
            'company_email' => $company->company_email,
            'website' => $company->website,
            'corporate_number' => $company->corporate_number,
            'invoice_number' => $company->invoice_number,
            'status' => $company->status,
            // 審査ワークフロー
            'review_status' => $company->review_status,
            'review_status_label' => $company->reviewStatusLabel(),
            'review_note' => $company->review_note,
            'is_approved' => $company->isApproved(),
            'submitted_at' => optional($company->submitted_at)->toIso8601String(),
            'reviewed_at' => optional($company->reviewed_at)->toIso8601String(),
            'rejected_documents' => $rejectedDocs,
            'documents_count' => $company->documents->count(),
            'member_code' => 'C-' . str_pad((string) $company->id, 7, '0', STR_PAD_LEFT),
            'registered_at' => optional($company->created_at)->toDateString(),
            'contact_email' => $request->user()->email,
        ]]);
    }

    /** 修正対応後の再申請（修正依頼→申請済みへ）。会社管理者のみ。 */
    public function resubmit(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;
        abort_if(! $company, 404);
        abort_unless($user->isCompanyAdmin(), 403, '再申請を行う権限がありません。');

        if ($company->review_status !== \App\Models\Company::REVIEW_REVISION) {
            return response()->json(['message' => '現在、再申請が必要な状態ではありません。'], 422);
        }

        $company->update([
            'review_status' => \App\Models\Company::REVIEW_SUBMITTED,
            'review_note' => null,
            'submitted_at' => now(),
        ]);
        activity('operation')->causedBy($user)->performedOn($company)->event('resubmitted')->log('加盟店が修正内容を再申請');

        return response()->json(['message' => '再申請を受け付けました。BASE88による審査をお待ちください。']);
    }

    /** 会社情報の更新（会社管理者のみ） */
    public function updateCompany(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;
        abort_if(! $company, 404);
        abort_unless($user->isCompanyAdmin(), 403, '会社情報を編集する権限がありません。');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'corporate_number' => ['nullable', 'string', 'max:20'],
            'invoice_number' => ['nullable', 'string', 'max:20'],
        ]);
        $company->update($data);

        return response()->json(['message' => '会社情報を更新しました。']);
    }

    /** 自社の担当者一覧 */
    public function staff(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $users = User::where('company_id', $companyId)->orderBy('id')->get();

        return response()->json(['data' => $users->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'is_active' => (bool) $u->is_active,
        ])]);
    }

    /** 担当者を追加（会社管理者のみ）。招待メール（パスワード設定リンク）を送る。 */
    public function createStaff(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isCompanyAdmin(), 403, '担当者を追加する権限がありません。');
        abort_if(! $user->company_id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in([User::ROLE_COMPANY_ADMIN, User::ROLE_STAFF])],
        ]);

        $staff = User::create([
            'company_id' => $user->company_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make(Str::random(40)), // 仮パスワード（本人がメールから設定）
            'role' => $data['role'],
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $staff->syncRoles([$data['role']]);

        // 招待メール（パスワード設定リンク）。メール失敗でも作成自体は成立させる。
        try {
            $token = Password::broker()->createToken($staff);
            $staff->notify(new StaffInvitation($user->company, $token));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => '担当者を追加し、招待メールを送信しました。'])->setStatusCode(201);
    }

    /** 担当者の有効／停止を切り替え（会社管理者のみ、自分自身は不可） */
    public function toggleStaff(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        abort_unless($me->isCompanyAdmin(), 403, '権限がありません。');
        abort_unless($user->company_id === $me->company_id, 403, '他社の担当者は操作できません。');
        if ($user->id === $me->id) {
            throw ValidationException::withMessages(['user' => ['自分自身の状態は変更できません。']]);
        }

        $user->update(['is_active' => ! $user->is_active]);
        if (! $user->is_active) {
            $user->tokens()->delete(); // 停止時はログインセッションを失効
        }

        return response()->json(['message' => $user->is_active ? '担当者を有効にしました。' : '担当者を停止しました。']);
    }

    /** 退会（会社管理者のみ）：会社を論理削除し、全担当者を無効化・トークン失効 */
    public function withdraw(Request $request): JsonResponse
    {
        $me = $request->user();
        abort_unless($me->isCompanyAdmin(), 403, '退会手続きを行う権限がありません。');
        $company = $me->company;
        abort_if(! $company, 404);

        // 会社の全担当者を無効化＆トークン失効
        $staff = User::where('company_id', $company->id)->get();
        foreach ($staff as $u) {
            $u->update(['is_active' => false]);
            $u->tokens()->delete();
        }

        activity('operation')->causedBy($me)->performedOn($company)->event('withdrawn')->log('退会（加盟会社の利用停止）');

        $company->delete(); // 論理削除（softDeletes）

        return response()->json(['message' => '退会手続きが完了しました。ご利用ありがとうございました。']);
    }

    /** パスワード変更 */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['現在のパスワードが正しくありません。']]);
        }
        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'パスワードを変更しました。']);
    }
}
