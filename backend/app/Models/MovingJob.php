<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    protected $fillable = [
        'company_id',
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
        'note',
        'application_deadline',
        'status',
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

    public function isRecruiting(): bool
    {
        return $this->status === self::STATUS_RECRUITING;
    }

    /** 添付は画像・PDF のみ、1ファイル最大 10MB を許可 */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attachments')
            ->acceptsMimeTypes([
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
            ]);
    }
}
