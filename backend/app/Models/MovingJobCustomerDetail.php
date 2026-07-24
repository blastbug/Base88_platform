<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 顧客情報（成約後のみ開示）
 * 【重要】このモデルのデータは、成約会社以外に絶対に露出させない。
 *   API では MovingJobCustomerDetailPolicy 経由でのみ取得すること。
 */
class MovingJobCustomerDetail extends Model
{
    protected $fillable = [
        'moving_job_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'contact_note',
    ];

    public function movingJob(): BelongsTo
    {
        return $this->belongsTo(MovingJob::class);
    }
}
