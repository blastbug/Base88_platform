<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * 成約
 */
class JobContract extends Model
{
    protected $fillable = [
        'moving_job_id',
        'job_application_id',
        'winning_company_id',
        'contracted_at',
    ];

    protected function casts(): array
    {
        return [
            'contracted_at' => 'datetime',
        ];
    }

    /** 成約時に精算レコードを自動作成（売上金額は案件の希望金額、計上月は成約月） */
    protected static function booted(): void
    {
        static::created(function (JobContract $contract): void {
            $contract->finance()->firstOrCreate([], [
                'company_id' => $contract->winning_company_id,
                'sale_amount' => $contract->movingJob?->desired_price,
                'settled_month' => ($contract->contracted_at ?? now())->copy()->startOfMonth(),
            ]);
        });
    }

    public function movingJob(): BelongsTo
    {
        return $this->belongsTo(MovingJob::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    /** 成約会社 */
    public function winningCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'winning_company_id');
    }

    /** 精算・売上情報 */
    public function finance(): HasOne
    {
        return $this->hasOne(JobFinance::class);
    }
}
