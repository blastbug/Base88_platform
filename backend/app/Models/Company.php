<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 加盟会社
 *
 * status（ログイン可否のゲート）: pending / approved / suspended
 * review_status（審査ワークフロー・7段階）は下記 REVIEW_* を参照。
 * review_status を変更すると saving フックで status を自動整合する。
 */
class Company extends Model
{
    use SoftDeletes;

    // ログイン可否ゲート
    public const STATUS_PENDING   = 'pending';   // 承認待ち
    public const STATUS_APPROVED  = 'approved';  // 承認済み（利用可）
    public const STATUS_SUSPENDED = 'suspended'; // 利用停止

    // 審査ワークフロー（クライアント指定の7段階）
    public const REVIEW_DRAFT        = 'draft';        // 入力途中
    public const REVIEW_SUBMITTED    = 'submitted';    // 申請済み
    public const REVIEW_UNDER_REVIEW = 'under_review'; // 審査中
    public const REVIEW_REVISION     = 'revision';     // 修正依頼
    public const REVIEW_APPROVED     = 'approved';     // 承認済み
    public const REVIEW_SUSPENDED    = 'suspended';    // 利用停止
    public const REVIEW_TERMINATED   = 'terminated';   // 契約終了

    public const REVIEW_LABELS = [
        self::REVIEW_DRAFT        => '入力途中',
        self::REVIEW_SUBMITTED    => '申請済み',
        self::REVIEW_UNDER_REVIEW => '審査中',
        self::REVIEW_REVISION     => '修正依頼',
        self::REVIEW_APPROVED     => '承認済み',
        self::REVIEW_SUSPENDED    => '利用停止',
        self::REVIEW_TERMINATED   => '契約終了',
    ];

    protected $fillable = [
        // 基本
        'name', 'name_kana', 'address', 'postal_code', 'phone', 'company_email',
        'corporate_number', 'invoice_number', 'established_ym', 'website',
        'service_areas', 'business_hours', 'holidays',
        // 代表者
        'rep_name', 'rep_name_kana', 'rep_birthday', 'rep_address', 'rep_phone', 'rep_email',
        // 担当者
        'contact_name', 'contact_department', 'contact_title', 'contact_phone', 'contact_email',
        // 会社規模
        'employee_count', 'worker_count', 'sales_staff_count', 'vehicle_count',
        // 許可
        'has_antique_license', 'has_light_cargo_license', 'has_general_cargo_license',
        // 実績
        'experience_years', 'annual_jobs', 'monthly_capacity', 'corporate_experience',
        'individual_experience', 'long_distance_support', 'peak_capacity', 'main_clients', 'achievements',
        // 保険
        'has_transport_insurance', 'has_cargo_insurance', 'has_liability_insurance', 'has_auto_insurance',
        'insurer_name', 'policy_number', 'coverage_amount', 'insurance_expiry',
        // 資材
        'material_hanger_box', 'material_futon_bag', 'material_mattress_cover',
        'material_plastic_sheet', 'material_floor_board_m',
        // 対応サービス
        'svc_disposal_pickup', 'svc_disposal_buy', 'svc_ac_install', 'svc_washer_install',
        'svc_furniture_assembly', 'svc_appliance_install', 'svc_packing', 'svc_unpacking',
        'svc_protection', 'svc_long_distance', 'svc_storage',
        // 審査
        'status', 'review_status', 'review_note', 'submitted_at', 'reviewed_at', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'rep_birthday' => 'date',
            'insurance_expiry' => 'date',
            'employee_count' => 'integer',
            'worker_count' => 'integer',
            'sales_staff_count' => 'integer',
            'vehicle_count' => 'integer',
            'experience_years' => 'integer',
            'annual_jobs' => 'integer',
            'monthly_capacity' => 'integer',
            'peak_capacity' => 'integer',
            'coverage_amount' => 'integer',
            'material_hanger_box' => 'integer',
            'material_futon_bag' => 'integer',
            'material_mattress_cover' => 'integer',
            'material_plastic_sheet' => 'integer',
            'material_floor_board_m' => 'integer',
            'has_antique_license' => 'boolean',
            'has_light_cargo_license' => 'boolean',
            'has_general_cargo_license' => 'boolean',
            'corporate_experience' => 'boolean',
            'individual_experience' => 'boolean',
            'long_distance_support' => 'boolean',
            'has_transport_insurance' => 'boolean',
            'has_cargo_insurance' => 'boolean',
            'has_liability_insurance' => 'boolean',
            'has_auto_insurance' => 'boolean',
            'svc_disposal_pickup' => 'boolean',
            'svc_disposal_buy' => 'boolean',
            'svc_ac_install' => 'boolean',
            'svc_washer_install' => 'boolean',
            'svc_furniture_assembly' => 'boolean',
            'svc_appliance_install' => 'boolean',
            'svc_packing' => 'boolean',
            'svc_unpacking' => 'boolean',
            'svc_protection' => 'boolean',
            'svc_long_distance' => 'boolean',
            'svc_storage' => 'boolean',
        ];
    }

    /**
     * 審査ステータス変更時、ログイン可否ゲート（status）を自動整合する。
     * 承認済み→approved（利用可）、利用停止/契約終了→suspended、それ以外→pending。
     */
    protected static function booted(): void
    {
        static::saving(function (Company $company): void {
            if (! $company->isDirty('review_status')) {
                return;
            }
            $company->status = match ($company->review_status) {
                self::REVIEW_APPROVED => self::STATUS_APPROVED,
                self::REVIEW_SUSPENDED, self::REVIEW_TERMINATED => self::STATUS_SUSPENDED,
                default => self::STATUS_PENDING,
            };
            if ($company->review_status === self::REVIEW_APPROVED && ! $company->approved_at) {
                $company->approved_at = now();
            }
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(CompanyVehicle::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CompanyDocument::class);
    }

    /** 自社が発注（掲載）した案件 */
    public function postedJobs(): HasMany
    {
        return $this->hasMany(MovingJob::class);
    }

    /** 自社の応募 */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    /** 精算・売上（成約案件ごと） */
    public function finances(): HasMany
    {
        return $this->hasMany(JobFinance::class);
    }

    /** 月次請求書 */
    public function invoices(): HasMany
    {
        return $this->hasMany(CompanyInvoice::class);
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function reviewStatusLabel(): string
    {
        return self::REVIEW_LABELS[$this->review_status] ?? (string) $this->review_status;
    }
}
