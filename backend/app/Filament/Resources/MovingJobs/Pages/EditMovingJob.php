<?php

namespace App\Filament\Resources\MovingJobs\Pages;

use App\Filament\Resources\MovingJobs\MovingJobResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;

class EditMovingJob extends EditRecord
{
    protected static string $resource = MovingJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            ForceDeleteAction::make(),
            RestoreAction::make(),
        ];
    }
}
