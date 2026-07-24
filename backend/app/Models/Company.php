<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 加盟会社
 */
class Company extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING   = 'pending';   // 承認待ち
    public const STATUS_APPROVED  = 'approved';  // 承認済み（利用可）
    public const STATUS_SUSPENDED = 'suspended'; // 利用停止

    protected $fillable = [
        'name',
        'address',
        'phone',
        'corporate_number',
        'invoice_number',
        'status',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
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

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }
}
