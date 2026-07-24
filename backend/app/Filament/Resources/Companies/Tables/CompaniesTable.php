<?php

namespace App\Filament\Resources\Companies\Tables;

use App\Models\Company;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CompaniesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('会社名')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('representative')
                    ->label('担当者名')
                    ->getStateUsing(fn (Company $r) => $r->users->first()?->name ?? '—'),
                TextColumn::make('contact_email')
                    ->label('メールアドレス')
                    ->getStateUsing(fn (Company $r) => $r->users->first()?->email ?? '—'),
                TextColumn::make('status')
                    ->label('ステータス')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        Company::STATUS_APPROVED => '承認済',
                        Company::STATUS_PENDING => '申請中',
                        Company::STATUS_SUSPENDED => '停止',
                        default => $state,
                    })
                    ->color(fn (string $state) => match ($state) {
                        Company::STATUS_APPROVED => 'success',
                        Company::STATUS_PENDING => 'warning',
                        Company::STATUS_SUSPENDED => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('created_at')
                    ->label('登録日')
                    ->date('Y/m/d')
                    ->sortable(),
            ])
            ->recordActions([
                EditAction::make()->label('編集'),
                Action::make('approve')
                    ->label('承認')
                    ->color('success')
                    ->icon('heroicon-o-check-circle')
                    ->visible(fn (Company $r) => $r->status !== Company::STATUS_APPROVED)
                    ->requiresConfirmation()
                    ->modalHeading('加盟会社を承認')
                    ->action(fn (Company $r) => $r->update(['status' => Company::STATUS_APPROVED, 'approved_at' => now()])),
                Action::make('suspend')
                    ->label('停止')
                    ->color('danger')
                    ->icon('heroicon-o-no-symbol')
                    ->visible(fn (Company $r) => $r->status === Company::STATUS_APPROVED)
                    ->requiresConfirmation()
                    ->modalHeading('加盟会社を利用停止')
                    ->action(fn (Company $r) => $r->update(['status' => Company::STATUS_SUSPENDED])),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
