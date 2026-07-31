<?php

namespace App\Filament\Resources\CompanyInvoices\Tables;

use App\Models\CompanyInvoice;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CompanyInvoicesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('company.name')->label('加盟店')->weight('bold')->searchable(),
                TextColumn::make('target_month')->label('対象月')->sortable(),
                TextColumn::make('amount')->label('請求金額')->money('JPY')->sortable(),
                TextColumn::make('uploaded_at')->label('アップロード日')->date('Y/m/d'),
                TextColumn::make('review_status')->label('確認状況')->badge()
                    ->formatStateUsing(fn (string $state) => CompanyInvoice::REVIEW_LABELS[$state] ?? $state)
                    ->color(fn (string $state) => match ($state) {
                        CompanyInvoice::REVIEW_CONFIRMED => 'success',
                        CompanyInvoice::REVIEW_REJECTED => 'danger',
                        default => 'warning',
                    }),
                TextColumn::make('payment_status')->label('支払状況')->badge()
                    ->formatStateUsing(fn (string $state) => $state === CompanyInvoice::PAY_PAID ? '支払済み' : '未払い')
                    ->color(fn (string $state) => $state === CompanyInvoice::PAY_PAID ? 'success' : 'gray'),
            ])
            ->filters([
                SelectFilter::make('review_status')->label('確認状況')->options(CompanyInvoice::REVIEW_LABELS),
                SelectFilter::make('payment_status')->label('支払状況')->options([
                    CompanyInvoice::PAY_UNPAID => '未払い', CompanyInvoice::PAY_PAID => '支払済み',
                ]),
            ])
            ->recordActions([
                EditAction::make()->label('編集'),
                ActionGroup::make([
                    Action::make('confirm')->label('確認済みにする')->icon('heroicon-o-check-circle')->color('success')
                        ->visible(fn (CompanyInvoice $r) => $r->review_status !== CompanyInvoice::REVIEW_CONFIRMED)
                        ->requiresConfirmation()
                        ->action(function (CompanyInvoice $r) {
                            $r->update(['review_status' => CompanyInvoice::REVIEW_CONFIRMED, 'reject_reason' => null]);
                            activity('operation')->causedBy(auth()->user())->performedOn($r)->event('invoice_confirmed')->log('請求書を確認済みに');
                        }),
                    Action::make('reject')->label('修正依頼')->icon('heroicon-o-pencil-square')->color('danger')
                        ->schema([Textarea::make('reject_reason')->label('修正依頼の理由')->required()->rows(3)])
                        ->modalHeading('請求書の修正を依頼')
                        ->action(function (array $data, CompanyInvoice $r) {
                            $r->update(['review_status' => CompanyInvoice::REVIEW_REJECTED, 'reject_reason' => $data['reject_reason']]);
                            activity('operation')->causedBy(auth()->user())->performedOn($r)->event('invoice_rejected')->log('請求書の修正を依頼');
                        }),
                    Action::make('mark_paid')->label('支払済みにする')->icon('heroicon-o-banknotes')->color('success')
                        ->visible(fn (CompanyInvoice $r) => $r->payment_status !== CompanyInvoice::PAY_PAID)
                        ->requiresConfirmation()
                        ->action(function (CompanyInvoice $r) {
                            $r->update(['payment_status' => CompanyInvoice::PAY_PAID, 'paid_at' => now()]);
                            activity('operation')->causedBy(auth()->user())->performedOn($r)->event('invoice_paid')->log('請求書を支払済みに');
                        }),
                ])->label('操作')->button()->icon('heroicon-o-cog-6-tooth'),
            ])
            ->defaultSort('target_month', 'desc');
    }
}
