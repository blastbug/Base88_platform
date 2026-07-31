<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 保有車両（加盟店登録フォーマット 5.）
 */
class CompanyVehicle extends Model
{
    protected $fillable = [
        'company_id',
        'vehicle_type',
        'truck_size',
        'count',
        'max_load',
        'plate_number',
        'ownership',
        'availability',
    ];

    protected function casts(): array
    {
        return [
            'count' => 'integer',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
