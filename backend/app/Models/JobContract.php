<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
