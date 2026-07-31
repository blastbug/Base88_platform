<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use App\Notifications\CompanyRegistered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** 会社登録申請（自己登録）。会社を「承認待ち」で作成し、代表担当者を会社管理者として登録。 */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'corporate_number' => ['nullable', 'string', 'max:30'],
            'invoice_number' => ['nullable', 'string', 'max:30'],
            'representative_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $company = DB::transaction(function () use ($data) {
            $company = Company::create([
                'name' => $data['company_name'],
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'],
                'corporate_number' => $data['corporate_number'] ?? null,
                'invoice_number' => $data['invoice_number'] ?? null,
                'status' => Company::STATUS_PENDING,
            ]);

            $user = User::create([
                'company_id' => $company->id,
                'name' => $data['representative_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => User::ROLE_COMPANY_ADMIN,
                'is_active' => true,
            ]);
            $user->syncRoles([User::ROLE_COMPANY_ADMIN]);

            return $company;
        });

        // アクセス・活動ログに会社登録申請を記録（開発者専用ログ画面で参照）
        try {
            activity('access')
                ->withProperties([
                    'type' => 'register',
                    'email' => $data['email'],
                    'company' => $data['company_name'],
                    'ip' => $request->ip(),
                    'ua' => substr((string) $request->userAgent(), 0, 255),
                ])
                ->event('register')
                ->log('会社登録申請: ' . $data['company_name']);
        } catch (\Throwable $e) {
            report($e);
        }

        // 運営（BASE88管理者）へ申請通知（メール失敗は申請処理を止めない）
        try {
            $admins = User::where('role', User::ROLE_PLATFORM_ADMIN)->where('is_active', true)->get();
            Notification::send($admins, new CompanyRegistered($company));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'message' => '登録を受け付けました。ログイン後、申請状況の確認や登録情報の入力を行えます。BASE88の審査・承認後にサービスをご利用いただけます。',
        ], 201);
    }

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

        // 加盟会社ユーザーのログイン制御。
        // 申請中・審査中・修正依頼の会社もログイン可（申請状況の確認・修正のため）。
        // 利用停止・契約終了のみログイン不可。
        if ($user->company_id) {
            $company = $user->company;
            if (! $company) {
                throw ValidationException::withMessages([
                    'email' => ['所属会社が見つかりません。管理者にお問い合わせください。'],
                ]);
            }
            if (in_array($company->review_status, [Company::REVIEW_SUSPENDED, Company::REVIEW_TERMINATED], true)
                || $company->status === Company::STATUS_SUSPENDED) {
                throw ValidationException::withMessages([
                    'email' => ['所属会社が利用停止中、または契約終了となっています。管理者にお問い合わせください。'],
                ]);
            }
        }

        $token = $user->createToken('web')->plainTextToken;

        $this->logAccess($request, $user, 'login', '加盟会社アプリにログイン');

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    /** ログアウト：現在のトークンを失効 */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->logAccess($request, $user, 'logout', '加盟会社アプリからログアウト');
        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'ログアウトしました。']);
    }

    /** アクセス・活動ログ（開発者専用ログ画面で参照）に記録する */
    private function logAccess(Request $request, User $user, string $event, string $description): void
    {
        try {
            activity('access')
                ->causedBy($user)
                ->withProperties([
                    'type' => $event,
                    'email' => $user->email,
                    'role' => $user->role,
                    'company' => $user->company?->name,
                    'ip' => $request->ip(),
                    'ua' => substr((string) $request->userAgent(), 0, 255),
                ])
                ->event($event)
                ->log($description);
        } catch (\Throwable $e) {
            report($e);
        }
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
