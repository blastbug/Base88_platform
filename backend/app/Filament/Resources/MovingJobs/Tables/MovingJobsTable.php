<?php

namespace App\Filament\Resources\MovingJobs\Tables;

use App\Models\MovingJob;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class MovingJobsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('moving_date')->label('引越予定日')->date('Y/m/d')->sortable(),
                TextColumn::make('route')->label('出発地 → 到着地')
                    ->getStateUsing(fn (MovingJob $r) => "{$r->from_prefecture} → {$r->to_prefecture}")
                    ->searchable(['from_prefecture', 'to_prefecture']),
                TextColumn::make('company.name')->label('掲載会社')->searchable(),
                TextColumn::make('desired_price')->label('希望金額')->money('JPY')->sortable(),
                TextColumn::make('applications_count')->label('応募数')->counts('applications')->alignCenter(),
                TextColumn::make('status')->label('募集状況')->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        MovingJob::STATUS_RECRUITING => '募集中',
                        MovingJob::STATUS_CLOSED => '募集終了',
                        MovingJob::STATUS_CONTRACTED => '成約済',
                        MovingJob::STATUS_COMPLETED => '完了',
                        MovingJob::STATUS_CANCELLED => 'キャンセル',
                        default => $state,
                    })
                    ->color(fn (string $state) => match ($state) {
                        MovingJob::STATUS_RECRUITING => 'success',
                        MovingJob::STATUS_CONTRACTED => 'info',
                        MovingJob::STATUS_CANCELLED => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('application_deadline')->label('締切')->date('Y/m/d')->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')->label('募集状況')->options([
                    MovingJob::STATUS_RECRUITING => '募集中',
                    MovingJob::STATUS_CONTRACTED => '成約済',
                    MovingJob::STATUS_COMPLETED => '完了',
                    MovingJob::STATUS_CANCELLED => 'キャンセル',
                ]),
            ])
            ->recordActions([
                ViewAction::make()->label('詳細'),
                DeleteAction::make()->label('削除'),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
