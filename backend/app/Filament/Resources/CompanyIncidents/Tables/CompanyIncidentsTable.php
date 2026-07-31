<?php

namespace App\Filament\Resources\CompanyIncidents\Tables;

use App\Models\CompanyIncident;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CompanyIncidentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('occurred_on')->label('発生日')->date('Y/m/d')->sortable(),
                TextColumn::make('company.name')->label('加盟店')->weight('bold')->searchable(),
                TextColumn::make('type')->label('種別')->badge()
                    ->formatStateUsing(fn (string $state) => CompanyIncident::TYPE_LABELS[$state] ?? $state)
                    ->color(fn (string $state) => $state === CompanyIncident::TYPE_ACCIDENT ? 'danger' : 'warning'),
                TextColumn::make('title')->label('件名')->wrap()->searchable(),
                TextColumn::make('movingJob.job_code')->label('関連案件')->placeholder('—'),
                TextColumn::make('damage_amount')->label('損害額・未収額')->money('JPY')->placeholder('—'),
                TextColumn::make('status')->label('ステータス')->badge()
                    ->formatStateUsing(fn (string $state) => CompanyIncident::STATUS_LABELS[$state] ?? $state)
                    ->color(fn (string $state) => $state === CompanyIncident::STATUS_RESOLVED ? 'success' : 'gray'),
            ])
            ->filters([
                SelectFilter::make('type')->label('種別')->options(CompanyIncident::TYPE_LABELS),
                SelectFilter::make('status')->label('ステータス')->options(CompanyIncident::STATUS_LABELS),
                SelectFilter::make('company_id')->label('加盟店')->relationship('company', 'name')->searchable()->preload(),
            ])
            ->recordActions([
                EditAction::make()->label('編集'),
            ])
            ->defaultSort('occurred_on', 'desc');
    }
}
