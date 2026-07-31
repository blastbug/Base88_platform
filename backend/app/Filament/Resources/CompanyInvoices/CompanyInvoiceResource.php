<?php

namespace App\Filament\Resources\CompanyInvoices;

use App\Filament\Resources\CompanyInvoices\Pages\ListCompanyInvoices;
use App\Filament\Resources\CompanyInvoices\Schemas\CompanyInvoiceForm;
use App\Filament\Resources\CompanyInvoices\Tables\CompanyInvoicesTable;
use App\Models\CompanyInvoice;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CompanyInvoiceResource extends Resource
{
    protected static ?string $model = CompanyInvoice::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static ?string $navigationLabel = '請求書管理';

    protected static string|\UnitEnum|null $navigationGroup = '業務管理';

    protected static ?string $modelLabel = '請求書';

    protected static ?string $pluralModelLabel = '請求書';

    protected static ?int $navigationSort = 6;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return CompanyInvoiceForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CompanyInvoicesTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCompanyInvoices::route('/'),
        ];
    }
}
