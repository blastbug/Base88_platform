<?php

namespace App\Filament\Widgets;

use App\Models\JobApplication;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;

class RecentApplications extends TableWidget
{
    protected static bool $isLazy = false;

    protected static ?string $heading = '最近の応募';

    protected static ?int $sort = 5;

    protected int|string|array $columnSpan = 1;

    public function table(Table $table): Table
    {
        return $table
            ->query(fn () => JobApplication::query()->with(['company', 'movingJob'])->latest()->limit(6))
            ->paginated(false)
            ->columns([
                TextColumn::make('company.name')
                    ->label('応募会社')
                    ->weight('bold')
                    ->description(fn (JobApplication $r) => $r->movingJob
                        ? "{$r->movingJob->from_prefecture} → {$r->movingJob->to_prefecture}"
                        : '—'),
                TextColumn::make('status')
                    ->label('状態')
                    ->badge()
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
                TextColumn::make('created_at')
                    ->label('応募日時')
                    ->since()
                    ->alignEnd(),
            ]);
    }
}
