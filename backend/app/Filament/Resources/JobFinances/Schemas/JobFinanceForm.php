<?php

namespace App\Filament\Resources\JobFinances\Schemas;

use App\Models\JobFinance;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class JobFinanceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('売上・代行集金')
                    ->description('代行集金額と手数料率から送金額を自動計算します。加盟店入力後、内容を確認してください。')
                    ->icon('heroicon-o-banknotes')
                    ->columns(2)
                    ->schema([
                        TextInput::make('sale_amount')->label('売上金額（受注金額）')->numeric()->prefix('¥'),
                        TextInput::make('collected_amount')->label('代行集金額')->numeric()->prefix('¥')
                            ->helperText('加盟店が現地で集金した金額'),
                        TextInput::make('collection_fee_rate')->label('代行集金手数料率')->numeric()
                            ->suffix('%')->default(10)->helperText('管理者が変更できます'),
                        Toggle::make('collection_confirmed')->label('代行集金を確認済みにする')->inline(false),
                        // 送金額（自動計算・表示のみ。保存後に再計算される）
                        TextInput::make('remit_preview')->label('送金額（自動計算）')->prefix('¥')
                            ->disabled()->dehydrated(false)
                            ->helperText('代行集金額 − 手数料（保存すると再計算されます）')
                            ->formatStateUsing(fn (?JobFinance $record): int => $record?->remit_amount ?? 0),
                    ]),

                Section::make('追加料金')
                    ->description('当日の作業内容変更などで追加料金が発生した場合に入力します。')
                    ->icon('heroicon-o-plus-circle')
                    ->columns(2)
                    ->schema([
                        TextInput::make('additional_amount')->label('追加料金額')->numeric()->prefix('¥'),
                        DatePicker::make('additional_input_date')->label('入力日')->native(false),
                        TextInput::make('additional_detail')->label('追加料金の内容'),
                        TextInput::make('additional_reason')->label('発生理由'),
                        Textarea::make('additional_note')->label('備考')->rows(2)->columnSpanFull(),
                        Toggle::make('additional_confirmed')->label('追加料金を確認済み・承認にする')->inline(false),
                    ]),

                Section::make('請求・支払')
                    ->icon('heroicon-o-document-currency-yen')
                    ->columns(2)
                    ->schema([
                        TextInput::make('billing_amount')->label('請求予定金額')->numeric()->prefix('¥'),
                        TextInput::make('payment_amount')->label('支払予定金額')->numeric()->prefix('¥'),
                        Select::make('deposit_status')->label('入金状況')
                            ->options([
                                JobFinance::DEPOSIT_UNPAID => '未入金',
                                JobFinance::DEPOSIT_PARTIAL => '一部入金',
                                JobFinance::DEPOSIT_PAID => '入金済み',
                            ])->default(JobFinance::DEPOSIT_UNPAID)->native(false),
                        Select::make('payment_status')->label('支払状況')
                            ->options([
                                JobFinance::PAY_UNPAID => '未払い',
                                JobFinance::PAY_PAID => '支払済み',
                            ])->default(JobFinance::PAY_UNPAID)->native(false),
                        DatePicker::make('settled_month')->label('計上月')->native(false)->displayFormat('Y年n月'),
                    ]),
            ]);
    }
}
