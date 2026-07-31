<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 加盟店からの月次請求書。
 */
class CompanyInvoice extends Model
{
    public const REVIEW_PENDING   = 'pending';   // 確認待ち
    public const REVIEW_CONFIRMED = 'confirmed'; // 確認済み
    public const REVIEW_REJECTED  = 'rejected';  // 修正依頼

    public const PAY_UNPAID = 'unpaid';
    public const PAY_PAID   = 'paid';

    public const REVIEW_LABELS = [
        self::REVIEW_PENDING => '確認待ち',
        self::REVIEW_CONFIRMED => '確認済み',
        self::REVIEW_REJECTED => '修正依頼',
    ];

    protected $fillable = [
        'company_id', 'target_month', 'amount', 'file_path', 'uploaded_at',
        'review_status', 'reject_reason', 'payment_status', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'uploaded_at' => 'datetime',
            'paid_at' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function reviewLabel(): string
    {
        return self::REVIEW_LABELS[$this->review_status] ?? (string) $this->review_status;
    }
}
