<?php

namespace App\Filament\Resources\CompanyIncidents;

use App\Filament\Resources\CompanyIncidents\Pages\CreateCompanyIncident;
use App\Filament\Resources\CompanyIncidents\Pages\EditCompanyIncident;
use App\Filament\Resources\CompanyIncidents\Pages\ListCompanyIncidents;
use App\Filament\Resources\CompanyIncidents\Schemas\CompanyIncidentForm;
use App\Filament\Resources\CompanyIncidents\Tables\CompanyIncidentsTable;
use App\Models\CompanyIncident;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CompanyIncidentResource extends Resource
{
    protected static ?string $model = CompanyIncident::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedExclamationTriangle;

    protected static ?string $navigationLabel = '事故・クレーム管理';

    protected static string|\UnitEnum|null $navigationGroup = '業務管理';

    protected static ?string $modelLabel = '事故・クレーム';

    protected static ?string $pluralModelLabel = '事故・クレーム';

    protected static ?int $navigationSort = 7;

    public static function form(Schema $schema): Schema
    {
        return CompanyIncidentForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CompanyIncidentsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCompanyIncidents::route('/'),
            'create' => CreateCompanyIncident::route('/create'),
            'edit' => EditCompanyIncident::route('/{record}/edit'),
        ];
    }
}
