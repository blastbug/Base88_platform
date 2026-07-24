<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 応募
 */
class JobApplication extends Model
{
    public const STATUS_APPLIED  = 'applied';  // 応募中
    public const STATUS_ACCEPTED = 'accepted'; // 成約
    public const STATUS_REJECTED = 'rejected'; // 不成立

    protected $fillable = [
        'moving_job_id',
        'company_id',
        'applied_by',
        'message',
        'status',
    ];

    public function movingJob(): BelongsTo
    {
        return $this->belongsTo(MovingJob::class);
    }

    /** 応募会社 */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** 応募担当者 */
    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by');
    }
}
