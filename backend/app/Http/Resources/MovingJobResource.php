<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 案件のJSON表現。
 * 【重要】顧客個人情報（customer）は、閲覧権限があると判定された場合のみ含める。
 *   権限判定はコントローラ側で $this->resource->canViewCustomer フラグとして渡す。
 */
class MovingJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isOwner = $user && $this->company_id === $user->company_id;
        $canViewCustomer = (bool) ($this->resource->canViewCustomer ?? false);

        return [
            'id' => $this->id,
            'status' => $this->status,
            'company' => $this->whenLoaded('company', fn () => [
                'id' => $this->company->id,
                'name' => $this->company->name,
            ]),
            'is_owner' => $isOwner,
            'moving_date' => optional($this->moving_date)->toDateString(),
            'time_slot' => $this->time_slot,
            'from_prefecture' => $this->from_prefecture,
            'from_city' => $this->from_city,
            'to_prefecture' => $this->to_prefecture,
            'to_city' => $this->to_city,
            'building_type' => $this->building_type,
            'layout' => $this->layout,
            'luggage_volume' => $this->luggage_volume,
            'truck_size' => $this->truck_size,
            'worker_count' => $this->worker_count,
            'floors' => $this->floors,
            'has_elevator' => $this->has_elevator,
            'desired_price' => $this->desired_price,
            'note' => $this->note,
            'application_deadline' => optional($this->application_deadline)->toIso8601String(),
            'applications_count' => $this->when(isset($this->applications_count), $this->applications_count),
            'has_applied' => $this->when(isset($this->resource->has_applied), fn () => (bool) $this->resource->has_applied),
            'created_at' => optional($this->created_at)->toIso8601String(),

            // 顧客情報は権限がある場合のみ
            'customer' => $this->when($canViewCustomer && $this->relationLoaded('customerDetail') && $this->customerDetail, fn () => [
                'name' => $this->customerDetail->customer_name,
                'phone' => $this->customerDetail->customer_phone,
                'address' => $this->customerDetail->customer_address,
                'contact_note' => $this->customerDetail->contact_note,
            ]),
        ];
    }
}
