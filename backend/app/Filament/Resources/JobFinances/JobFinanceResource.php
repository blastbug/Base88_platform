<?php

namespace App\Filament\Resources\JobFinances;

use App\Filament\Resources\JobFinances\Pages\EditJobFinance;
use App\Filament\Resources\JobFinances\Pages\ListJobFinances;
use App\Filament\Resources\JobFinances\Schemas\JobFinanceForm;
use App\Filament\Resources\JobFinances\Tables\JobFinancesTable;
use App\Models\JobFinance;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class JobFinanceResource extends Resource
{
    protected static ?string $model = JobFinance::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBanknotes;

    protected static ?string $navigationLabel = '精算・売上管理';

    protected static string|\UnitEnum|null $navigationGroup = '業務管理';

    protected static ?string $modelLabel = '精算';

    protected static ?string $pluralModelLabel = '精算';

    protected static ?int $navigationSort = 5;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return JobFinanceForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return JobFinancesTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListJobFinances::route('/'),
            'edit' => EditJobFinance::route('/{record}/edit'),
        ];
    }
}
