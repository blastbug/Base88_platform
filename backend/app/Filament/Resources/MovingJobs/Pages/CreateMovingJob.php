<?php

namespace App\Filament\Resources\MovingJobs\Pages;

use App\Filament\Resources\MovingJobs\Concerns\HandlesTimeSlot;
use App\Filament\Resources\MovingJobs\MovingJobResource;
use Filament\Resources\Pages\CreateRecord;

class CreateMovingJob extends CreateRecord
{
    use HandlesTimeSlot;

    protected static string $resource = MovingJobResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return $this->composeTimeSlot($data);
    }
}
