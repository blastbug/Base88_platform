<?php

namespace App\Filament\Resources\CompanyInvoices\Schemas;

use App\Models\CompanyInvoice;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CompanyInvoiceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('請求書の確認・支払')
                    ->icon('heroicon-o-document-text')
                    ->columns(2)
                    ->schema([
                        TextInput::make('target_month')->label('対象月')->disabled(),
                        TextInput::make('amount')->label('請求金額')->numeric()->prefix('¥'),
                        Select::make('review_status')->label('確認状況')
                            ->options(CompanyInvoice::REVIEW_LABELS)->native(false)->required(),
                        Select::make('payment_status')->label('支払状況')
                            ->options([
                                CompanyInvoice::PAY_UNPAID => '未払い',
                                CompanyInvoice::PAY_PAID => '支払済み',
                            ])->native(false)->required(),
                        DatePicker::make('paid_at')->label('支払日')->native(false),
                        Textarea::make('reject_reason')->label('修正依頼（差し戻し理由）')
                            ->helperText('修正依頼にすると、加盟店側に理由が表示されます。')
                            ->rows(3)->columnSpanFull(),
                    ]),
            ]);
    }
}
