<?php

namespace App\Filament\Resources\JobContracts;

use App\Filament\Resources\JobContracts\Pages\ListJobContracts;
use App\Filament\Resources\JobContracts\Tables\JobContractsTable;
use App\Models\JobContract;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class JobContractResource extends Resource
{
    protected static ?string $model = JobContract::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCheckBadge;

    protected static ?string $navigationLabel = '成約管理';

    protected static string|\UnitEnum|null $navigationGroup = '業務管理';

    protected static ?string $modelLabel = '成約';

    protected static ?string $pluralModelLabel = '成約';

    protected static ?int $navigationSort = 4;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return JobContractsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListJobContracts::route('/'),
        ];
    }
}
