<?php

namespace App\Filament\Resources\Companies\Schemas;

use App\Models\Company;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CompanyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('会社情報')
                    ->description('加盟会社の基本情報です。')
                    ->icon('heroicon-o-building-office-2')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')->label('会社名')->required()->columnSpanFull(),
                        TextInput::make('address')->label('住所')->columnSpanFull(),
                        TextInput::make('phone')->label('電話番号')->tel(),
                        TextInput::make('corporate_number')->label('法人番号')->helperText('任意'),
                        TextInput::make('invoice_number')->label('インボイス番号')->helperText('任意'),
                    ]),

                Section::make('利用ステータス')
                    ->description('承認状況を管理します。承認済みにすると加盟会社が利用を開始できます。')
                    ->icon('heroicon-o-shield-check')
                    ->columns(2)
                    ->schema([
                        Select::make('status')->label('ステータス')
                            ->options([
                                Company::STATUS_PENDING => '申請中',
                                Company::STATUS_APPROVED => '承認済',
                                Company::STATUS_SUSPENDED => '停止',
                            ])
                            ->default(Company::STATUS_PENDING)
                            ->native(false)
                            ->required(),
                        DateTimePicker::make('approved_at')->label('承認日時'),
                    ]),
            ]);
    }
}
