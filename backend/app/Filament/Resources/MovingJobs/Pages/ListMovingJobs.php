<?php

namespace App\Filament\Resources\MovingJobs\Pages;

use App\Filament\Resources\MovingJobs\MovingJobResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMovingJobs extends ListRecords
{
    protected static string $resource = MovingJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
