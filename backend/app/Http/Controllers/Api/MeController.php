<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        return response()->json(['data' => [
            'id' => $company->id,
            'name' => $company->name,
            'address' => $company->address,
            'phone' => $company->phone,
            'corporate_number' => $company->corporate_number,
            'invoice_number' => $company->invoice_number,
            'status' => $company->status,
            'member_code' => 'C-' . str_pad((string) $company->id, 7, '0', STR_PAD_LEFT),
            'registered_at' => optional($company->created_at)->toDateString(),
            'contact_email' => $request->user()->email,
        ]]);
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
