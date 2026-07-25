<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** ログイン：メール・パスワードを検証し、Sanctum トークンを発行する */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['メールアドレスまたはパスワードが正しくありません。'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['このアカウントは利用停止中です。管理者にお問い合わせください。'],
            ]);
        }

        // 加盟会社ユーザーは、所属会社が承認済みでなければログイン不可
        if ($user->company_id) {
            $company = $user->company;
            if (! $company || ! $company->isApproved()) {
                throw ValidationException::withMessages([
                    'email' => ['所属会社が承認待ち、または利用停止中です。'],
                ]);
            }
        }

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    /** ログアウト：現在のトークンを失効 */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'ログアウトしました。']);
    }

    /** 認証中ユーザー情報 */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    /** パスワード再設定メールの送信（メールアドレスの存在は明かさない） */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        // 登録有無に関わらず同じ応答（アカウント列挙防止）
        return response()->json([
            'message' => 'ご登録がある場合、パスワード再設定用のメールをお送りしました。',
        ]);
    }

    /** パスワード再設定の実行 */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => Hash::make($password)])->save();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['再設定に失敗しました。リンクが無効、または有効期限が切れている可能性があります。'],
            ]);
        }

        return response()->json(['message' => 'パスワードを再設定しました。ログインしてください。']);
    }

    private function userPayload(User $user): array
    {
        $user->loadMissing('company');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_platform_admin' => $user->isPlatformAdmin(),
            'company' => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'status' => $user->company->status,
            ] : null,
        ];
    }
}
