<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 案件ごとの精算・売上情報。
 * 送金額（remit_amount）= 代行集金額 − 代行集金手数料（率×集金額）を自動算出。
 */
class JobFinance extends Model
{
    public const DEPOSIT_UNPAID  = 'unpaid';
    public const DEPOSIT_PARTIAL = 'partial';
    public const DEPOSIT_PAID    = 'paid';

    public const PAY_UNPAID = 'unpaid';
    public const PAY_PAID   = 'paid';

    protected $fillable = [
        'job_contract_id', 'company_id', 'sale_amount',
        'collected_amount', 'collection_fee_rate', 'collection_confirmed',
        'additional_amount', 'additional_detail', 'additional_reason', 'additional_note',
        'additional_input_date', 'additional_confirmed',
        'billing_amount', 'payment_amount', 'deposit_status', 'payment_status', 'settled_month',
    ];

    protected function casts(): array
    {
        return [
            'sale_amount' => 'integer',
            'collected_amount' => 'integer',
            'collection_fee_rate' => 'decimal:2',
            'collection_confirmed' => 'boolean',
            'additional_amount' => 'integer',
            'additional_input_date' => 'date',
            'additional_confirmed' => 'boolean',
            'billing_amount' => 'integer',
            'payment_amount' => 'integer',
            'settled_month' => 'date',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(JobContract::class, 'job_contract_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** 代行集金手数料（率×集金額、円未満切り捨て） */
    public function getCollectionFeeAttribute(): int
    {
        $collected = (int) ($this->collected_amount ?? 0);
        $rate = (float) ($this->collection_fee_rate ?? 0);

        return (int) floor($collected * $rate / 100);
    }

    /** 送金額（代行集金額 − 手数料） */
    public function getRemitAmountAttribute(): int
    {
        return max(0, (int) ($this->collected_amount ?? 0) - $this->collection_fee);
    }
}
