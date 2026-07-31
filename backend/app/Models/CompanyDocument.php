<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 許可証・本人確認書類・保険証券（加盟店登録フォーマット 6/8）。
 * 書類ごとに管理者の確認状況（review_status）と差し戻し理由を保持する。
 */
class CompanyDocument extends Model
{
    public const REVIEW_PENDING   = 'pending';   // 確認待ち
    public const REVIEW_CONFIRMED = 'confirmed'; // 確認済み
    public const REVIEW_REJECTED  = 'rejected';  // 差し戻し

    /** 書類種別 */
    public const TYPES = [
        'drivers_license'   => '運転免許証',
        'antique_license'   => '古物商許可証',
        'light_cargo'       => '軽貨物運送事業 許可・届出',
        'general_cargo'     => '一般貨物自動車運送事業 許可証',
        'insurance_policy'  => '保険証券',
        'other'             => 'その他の許可証',
    ];

    protected $fillable = [
        'company_id',
        'doc_type',
        'doc_name',
        'permit_number',
        'expiry_date',
        'file_path',
        'review_status',
        'reject_reason',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function typeLabel(): string
    {
        return self::TYPES[$this->doc_type] ?? $this->doc_type;
    }
}
