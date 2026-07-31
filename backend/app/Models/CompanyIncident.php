<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 加盟店の事故・クレーム履歴（⑫）。
 */
class CompanyIncident extends Model
{
    public const TYPE_ACCIDENT  = 'accident';  // 事故
    public const TYPE_COMPLAINT = 'complaint'; // クレーム

    public const STATUS_OPEN     = 'open';     // 対応中
    public const STATUS_RESOLVED = 'resolved'; // 解決済み

    public const TYPE_LABELS = [
        self::TYPE_ACCIDENT => '事故',
        self::TYPE_COMPLAINT => 'クレーム',
    ];

    public const STATUS_LABELS = [
        self::STATUS_OPEN => '対応中',
        self::STATUS_RESOLVED => '解決済み',
    ];

    protected $fillable = [
        'company_id', 'moving_job_id', 'type', 'occurred_on',
        'title', 'description', 'status', 'resolution', 'damage_amount',
    ];

    protected function casts(): array
    {
        return [
            'occurred_on' => 'date',
            'damage_amount' => 'integer',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function movingJob(): BelongsTo
    {
        return $this->belongsTo(MovingJob::class);
    }

    public function typeLabel(): string
    {
        return self::TYPE_LABELS[$this->type] ?? $this->type;
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }
}
