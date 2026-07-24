<?php

namespace App\Filament\Resources\JobApplications\Tables;

use App\Models\JobApplication;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class JobApplicationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('movingJob.route')->label('案件')
                    ->getStateUsing(fn (JobApplication $r) => $r->movingJob ? "{$r->movingJob->from_prefecture} → {$r->movingJob->to_prefecture}" : '—'),
                TextColumn::make('company.name')->label('応募会社')->searchable(),
                TextColumn::make('applicant.name')->label('応募担当者'),
                TextColumn::make('status')->label('ステータス')->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        JobApplication::STATUS_APPLIED => '応募中',
                        JobApplication::STATUS_ACCEPTED => '成約',
                        JobApplication::STATUS_REJECTED => '不成立',
                        default => $state,
                    })
                    ->color(fn (string $state) => match ($state) {
                        JobApplication::STATUS_ACCEPTED => 'success',
                        JobApplication::STATUS_APPLIED => 'info',
                        default => 'gray',
                    }),
                TextColumn::make('created_at')->label('応募日時')->dateTime('Y/m/d H:i')->sortable(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
