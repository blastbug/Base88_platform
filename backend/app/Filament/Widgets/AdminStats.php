<?php

namespace App\Filament\Widgets;

use App\Models\Company;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class AdminStats extends StatsOverviewWidget
{
    protected static bool $isLazy = false;

    protected function getStats(): array
    {
        $monthStart = Carbon::now()->startOfMonth();

        return [
            Stat::make('加盟会社数', Company::count() . ' 社')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->color('primary'),
            Stat::make('案件（募集中）', MovingJob::where('status', MovingJob::STATUS_RECRUITING)->count() . ' 件')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->color('success'),
            Stat::make('応募数（今月）', JobApplication::where('created_at', '>=', $monthStart)->count() . ' 件')
                ->descriptionIcon('heroicon-m-paper-airplane')
                ->color('info'),
            Stat::make('成約数（今月）', JobContract::where('contracted_at', '>=', $monthStart)->count() . ' 件')
                ->descriptionIcon('heroicon-m-check-badge')
                ->color('warning'),
        ];
    }
}
