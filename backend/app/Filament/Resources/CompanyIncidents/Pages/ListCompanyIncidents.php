<?php

namespace App\Filament\Resources\CompanyIncidents\Pages;

use App\Filament\Resources\CompanyIncidents\CompanyIncidentResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCompanyIncidents extends ListRecords
{
    protected static string $resource = CompanyIncidentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('新規登録'),
        ];
    }
}
