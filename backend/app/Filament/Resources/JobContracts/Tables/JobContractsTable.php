<?php

namespace App\Filament\Resources\JobContracts\Tables;

use App\Models\JobContract;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class JobContractsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('movingJob.route')->label('案件')
                    ->getStateUsing(fn (JobContract $r) => $r->movingJob ? "{$r->movingJob->from_prefecture} → {$r->movingJob->to_prefecture}" : '—'),
                TextColumn::make('movingJob.company.name')->label('掲載会社'),
                TextColumn::make('winningCompany.name')->label('成約会社')->searchable(),
                TextColumn::make('contracted_at')->label('成約日時')->dateTime('Y/m/d H:i')->sortable(),
            ])
            ->defaultSort('contracted_at', 'desc');
    }
}
