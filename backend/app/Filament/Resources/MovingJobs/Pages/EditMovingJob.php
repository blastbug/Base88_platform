<?php

namespace App\Filament\Resources\MovingJobs\Pages;

use App\Filament\Resources\MovingJobs\Concerns\HandlesTimeSlot;
use App\Filament\Resources\MovingJobs\MovingJobResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;

class EditMovingJob extends EditRecord
{
    use HandlesTimeSlot;

    protected static string $resource = MovingJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            ForceDeleteAction::make(),
            RestoreAction::make(),
        ];
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        return $this->decomposeTimeSlot($data);
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        return $this->composeTimeSlot($data);
    }
}
