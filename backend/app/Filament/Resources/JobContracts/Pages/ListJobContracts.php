<?php

namespace App\Filament\Resources\JobContracts\Pages;

use App\Filament\Resources\JobContracts\JobContractResource;
use Filament\Resources\Pages\ListRecords;

class ListJobContracts extends ListRecords
{
    protected static string $resource = JobContractResource::class;
}
