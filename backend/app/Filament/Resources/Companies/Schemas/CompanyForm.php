<?php

namespace App\Filament\Resources\Companies\Schemas;

use App\Models\Company;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class CompanyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')->label('会社名')->required(),
                TextInput::make('address')->label('住所'),
                TextInput::make('phone')->label('電話番号')->tel(),
                TextInput::make('corporate_number')->label('法人番号'),
                TextInput::make('invoice_number')->label('インボイス番号'),
                Select::make('status')->label('ステータス')
                    ->options([
                        Company::STATUS_PENDING => '申請中',
                        Company::STATUS_APPROVED => '承認済',
                        Company::STATUS_SUSPENDED => '停止',
                    ])
                    ->default(Company::STATUS_PENDING)
                    ->required(),
                DateTimePicker::make('approved_at')->label('承認日時'),
            ]);
    }
}
