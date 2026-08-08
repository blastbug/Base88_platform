<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * 引越案件
 * 添付（画像・PDF）は spatie/medialibrary で管理（コレクション 'attachments'）。
 */
class MovingJob extends Model implements HasMedia
{
    use InteractsWithMedia, SoftDeletes;

    public const STATUS_RECRUITING = 'recruiting'; // 募集中
    public const STATUS_CLOSED     = 'closed';     // 募集終了（締切・自動終了）
    public const STATUS_CONTRACTED = 'contracted'; // 成約
    public const STATUS_COMPLETED  = 'completed';  // 完了
    public const STATUS_CANCELLED  = 'cancelled';  // キャンセル

    /** 支払方法 */
    public const PAYMENT_METHODS = [
        'credit_card'  => 'クレジットカード',
        'cash_on_site' => '当日代行集金',
    ];

    /** 配信方法 */
    public const DISTRIBUTION_ALL      = 'all';      // 全体配信
    public const DISTRIBUTION_TARGETED = 'targeted'; // 指名配信

    public const DISTRIBUTION_LABELS = [
        self::DISTRIBUTION_ALL      => '全体配信',
        self::DISTRIBUTION_TARGETED => '指名配信',
    ];

    protected $fillable = [
        'company_id',
        'job_code',
        'moving_date',
        'time_slot',
        'from_prefecture',
        'from_city',
        'to_prefecture',
        'to_city',
        'building_type',
        'layout',
        'luggage_volume',
        'truck_size',
        'worker_count',
        'floors',
        'has_elevator',
        'desired_price',
        'payment_method',
        'note',
        'application_deadline',
        'status',
        'distribution_type',
    ];

    protected function casts(): array
    {
        return [
            'moving_date' => 'date',
            'application_deadline' => 'datetime',
            'has_elevator' => 'boolean',
            'desired_price' => 'integer',
            'worker_count' => 'integer',
        ];
    }

    /**
     * 案件ID（job_code）が未設定なら作成後に自動発行する。
     * 管理者がフォームで任意の番号を入力した場合はそれを尊重する。
     */
    protected static function booted(): void
    {
        static::created(function (MovingJob $job): void {
            if (blank($job->job_code)) {
                $job->job_code = $job->generateJobCode();
                $job->saveQuietly();
            }
        });
    }

    /** 従来の表示コード形式（例: T-2026-0815-001）で自動発行 */
    public function generateJobCode(): string
    {
        $datePart = $this->moving_date
            ? $this->moving_date->format('Y-md')
            : now()->format('Y-md');

        return sprintf('T-%s-%03d', $datePart, $this->id);
    }

    /** 掲載（発注）会社 */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** 顧客情報（成約後のみ開示） */
    public function customerDetail(): HasOne
    {
        return $this->hasOne(MovingJobCustomerDetail::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function contract(): HasOne
    {
        return $this->hasOne(JobContract::class);
    }

    /** 指名配信の配信先（加盟会社） */
    public function targets(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'moving_job_targets');
    }

    /** 指定の加盟会社にこの案件が配信されているか（全体配信は常に true） */
    public function isVisibleToCompany(?int $companyId): bool
    {
        if ($this->distribution_type !== self::DISTRIBUTION_TARGETED) {
            return true;
        }
        if (! $companyId) {
            return false;
        }
        if ($this->company_id === $companyId) {
            return true;
        }

        return $this->targets()->where('companies.id', $companyId)->exists()
            || $this->applications()->where('company_id', $companyId)->exists();
    }

    public function isRecruiting(): bool
    {
        return $this->status === self::STATUS_RECRUITING;
    }

    /** 支払方法の表示ラベル */
    public function paymentMethodLabel(): ?string
    {
        return $this->payment_method ? (self::PAYMENT_METHODS[$this->payment_method] ?? $this->payment_method) : null;
    }

    /** 時間指定の有無（フリー便・指定なし・未設定は「無」） */
    public function hasTimeSpecified(): bool
    {
        $v = trim((string) $this->time_slot);

        return $v !== '' && ! in_array($v, ['フリー便', '指定なし', '終日'], true);
    }

    /** 出発地 → 到着地（市区町村まで） */
    public function routeWithCity(): string
    {
        $from = $this->from_prefecture.($this->from_city ? ' '.$this->from_city : '');
        $to = $this->to_prefecture.($this->to_city ? ' '.$this->to_city : '');

        return "{$from} → {$to}";
    }

    /** 添付は画像・PDF のみ、1ファイル最大 10MB を許可 */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attachments')
            ->acceptsMimeTypes([
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'application/pdf',
            ]);
    }
}
