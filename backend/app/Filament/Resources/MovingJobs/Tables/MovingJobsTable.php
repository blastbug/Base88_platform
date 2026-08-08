<?php

namespace App\Filament\Resources\MovingJobs\Tables;

use App\Models\MovingJob;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
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
                TextColumn::make('job_code')->label('案件ID')->weight('bold')->searchable()->sortable(),
                TextColumn::make('route')->label('出発地 → 到着地')
                    ->getStateUsing(fn (MovingJob $r) => $r->routeWithCity())
                    ->searchable(['from_prefecture', 'from_city', 'to_prefecture', 'to_city']),
                TextColumn::make('moving_date')->label('引越予定日')->date('Y/m/d')->sortable(),
                TextColumn::make('time_spec')->label('時間指定')->badge()
                    ->getStateUsing(fn (MovingJob $r) => $r->hasTimeSpecified() ? '有（'.$r->time_slot.'）' : '無')
                    ->color(fn (MovingJob $r) => $r->hasTimeSpecified() ? 'success' : 'gray'),
                TextColumn::make('payment_method')->label('支払方法')->badge()
                    ->getStateUsing(fn (MovingJob $r) => $r->paymentMethodLabel() ?? '—')
                    ->color(fn (MovingJob $r) => match ($r->payment_method) {
                        'credit_card' => 'info',
                        'cash_on_site' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('company.name')->label('掲載会社')->searchable()->toggleable(),
                TextColumn::make('desired_price')->label('希望金額')->money('JPY')->sortable()->toggleable(),
                TextColumn::make('applications_count')->label('応募数')->counts('applications')->alignCenter()->toggleable(),
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
                TextColumn::make('distribution_type')->label('配信')->badge()
                    ->formatStateUsing(fn (?string $state) => MovingJob::DISTRIBUTION_LABELS[$state] ?? '全体配信')
                    ->color(fn (?string $state) => $state === MovingJob::DISTRIBUTION_TARGETED ? 'warning' : 'gray')
                    ->toggleable(),
            ])
            ->filters([
                SelectFilter::make('status')->label('募集状況')->options([
                    MovingJob::STATUS_RECRUITING => '募集中',
                    MovingJob::STATUS_CONTRACTED => '成約済',
                    MovingJob::STATUS_COMPLETED => '完了',
                    MovingJob::STATUS_CANCELLED => 'キャンセル',
                ]),
                SelectFilter::make('distribution_type')->label('配信方法')->options(MovingJob::DISTRIBUTION_LABELS),
            ])
            ->recordActions([
                ViewAction::make()->label('詳細'),
                EditAction::make()->label('編集'),
                DeleteAction::make()->label('削除'),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
