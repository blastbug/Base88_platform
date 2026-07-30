<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /** ロール定数（spatie/permission のロール名とも一致させる） */
    public const ROLE_PLATFORM_ADMIN = 'platform_admin'; // BASE88管理者
    public const ROLE_COMPANY_ADMIN  = 'company_admin';  // 会社管理者
    public const ROLE_STAFF          = 'staff';          // 一般担当者

    protected $fillable = [
        'company_id',
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_developer' => 'boolean',
        ];
    }

    /** 開発者（案件受託者）専用アカウントか。開発者専用ログ画面の閲覧判定に使用。 */
    public function isDeveloper(): bool
    {
        return (bool) $this->is_developer;
    }

    /** 所属加盟会社（BASE88管理者は null） */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function isPlatformAdmin(): bool
    {
        return $this->role === self::ROLE_PLATFORM_ADMIN;
    }

    public function isCompanyAdmin(): bool
    {
        return $this->role === self::ROLE_COMPANY_ADMIN;
    }

    /** Filament 管理パネルへのアクセスは BASE88管理者のみ許可 */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->isPlatformAdmin() && $this->is_active;
    }

    /** パスワード再設定メールをフロントエンド用のカスタム通知で送る */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordLink($token));
    }
}
