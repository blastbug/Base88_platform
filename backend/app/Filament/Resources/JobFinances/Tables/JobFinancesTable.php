<?php

namespace App\Filament\Resources\JobFinances\Tables;

use App\Models\JobFinance;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\Summarizers\Sum;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Grouping\Group;
use Filament\Tables\Table;

class JobFinancesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('company.name')->label('加盟店')->weight('bold')->searchable(),
                TextColumn::make('settled_month')->label('計上月')->date('Y年n月')->sortable(),
                TextColumn::make('sale_amount')->label('売上')->money('JPY')->sortable()
                    ->summarize(Sum::make()->label('計')->money('JPY')),
                TextColumn::make('collected_amount')->label('代行集金')->money('JPY')
                    ->summarize(Sum::make()->label('計')->money('JPY')),
                TextColumn::make('collection_fee')->label('手数料')->state(fn (JobFinance $r) => $r->collection_fee)->money('JPY'),
                TextColumn::make('remit_amount')->label('送金額')->state(fn (JobFinance $r) => $r->remit_amount)->money('JPY')->color('success'),
                TextColumn::make('additional_amount')->label('追加料金')->money('JPY')
                    ->summarize(Sum::make()->label('計')->money('JPY')),
                TextColumn::make('deposit_status')->label('入金')->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        JobFinance::DEPOSIT_PAID => '入金済み', JobFinance::DEPOSIT_PARTIAL => '一部入金', default => '未入金',
                    })
                    ->color(fn (string $state) => match ($state) {
                        JobFinance::DEPOSIT_PAID => 'success', JobFinance::DEPOSIT_PARTIAL => 'warning', default => 'gray',
                    }),
                TextColumn::make('payment_status')->label('支払')->badge()
                    ->formatStateUsing(fn (string $state) => $state === JobFinance::PAY_PAID ? '支払済み' : '未払い')
                    ->color(fn (string $state) => $state === JobFinance::PAY_PAID ? 'success' : 'warning'),
                TextColumn::make('confirm')->label('確認')
                    ->state(fn (JobFinance $r) => ($r->collection_confirmed ? '集金✓ ' : '') . ($r->additional_amount && $r->additional_confirmed ? '追加✓' : ($r->additional_amount ? '追加未' : '')))
                    ->badge()->color('info'),
            ])
            ->groups([
                Group::make('settled_month')->label('計上月')->date('Y年n月')->collapsible(),
            ])
            ->defaultGroup('settled_month')
            ->filters([
                SelectFilter::make('company_id')->label('加盟店')->relationship('company', 'name')->searchable()->preload(),
                SelectFilter::make('payment_status')->label('支払状況')->options([
                    JobFinance::PAY_UNPAID => '未払い', JobFinance::PAY_PAID => '支払済み',
                ]),
                SelectFilter::make('deposit_status')->label('入金状況')->options([
                    JobFinance::DEPOSIT_UNPAID => '未入金', JobFinance::DEPOSIT_PARTIAL => '一部入金', JobFinance::DEPOSIT_PAID => '入金済み',
                ]),
            ])
            ->recordActions([
                EditAction::make()->label('編集'),
            ])
            ->defaultSort('settled_month', 'desc');
    }
}
