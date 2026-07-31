<?php

namespace App\Filament\Widgets;

use App\Models\Company;
use App\Models\CompanyIncident;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\JobFinance;
use App\Models\MovingJob;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminStats extends StatsOverviewWidget
{
    protected static bool $isLazy = false;

    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        /** 直近7ヶ月の月次系列（スパークライン用） */
        $series = function (callable $counter) use ($now): array {
            $out = [];
            for ($i = 6; $i >= 0; $i--) {
                $m = $now->copy()->subMonths($i);
                $out[] = $counter($m->copy()->startOfMonth(), $m->copy()->endOfMonth());
            }

            return $out;
        };

        // 加盟会社（累計・承認済み）
        $companyTotal = Company::count();
        $companyApproved = Company::where('status', Company::STATUS_APPROVED)->count();
        $companySeries = $series(fn (Carbon $s, Carbon $e) => Company::where('created_at', '<=', $e)->count());

        // 募集中案件・総案件
        $recruiting = MovingJob::where('status', MovingJob::STATUS_RECRUITING)->count();
        $jobsTotal = MovingJob::count();
        $jobsSeries = $series(fn (Carbon $s, Carbon $e) => MovingJob::whereBetween('created_at', [$s, $e])->count());

        // 応募（今月／前月）
        $appThis = JobApplication::where('created_at', '>=', $monthStart)->count();
        $appLast = JobApplication::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $appSeries = $series(fn (Carbon $s, Carbon $e) => JobApplication::whereBetween('created_at', [$s, $e])->count());

        // 成約（今月／前月）
        $conThis = JobContract::where('contracted_at', '>=', $monthStart)->count();
        $conLast = JobContract::whereBetween('contracted_at', [$lastMonthStart, $lastMonthEnd])->count();
        $conSeries = $series(fn (Carbon $s, Carbon $e) => JobContract::whereBetween('contracted_at', [$s, $e])->count());

        /** 前月比の説明文とアイコン */
        $delta = function (int $cur, int $prev): array {
            $d = $cur - $prev;
            if ($d > 0) {
                return ['前月比 +' . $d . ' 件', 'heroicon-m-arrow-trending-up'];
            }
            if ($d < 0) {
                return ['前月比 ' . $d . ' 件', 'heroicon-m-arrow-trending-down'];
            }

            return ['前月と同水準', 'heroicon-m-minus'];
        };
        [$appDesc, $appIcon] = $delta($appThis, $appLast);
        [$conDesc, $conIcon] = $delta($conThis, $conLast);

        // 未収金（入金未完了の請求予定額の合計）
        $receivable = (int) JobFinance::where('deposit_status', '!=', JobFinance::DEPOSIT_PAID)
            ->sum(DB::raw('COALESCE(billing_amount, sale_amount, 0)'));
        $receivableCount = JobFinance::where('deposit_status', '!=', JobFinance::DEPOSIT_PAID)->count();

        // 事故・クレーム（対応中）
        $openIncidents = CompanyIncident::where('status', CompanyIncident::STATUS_OPEN)->count();
        $incidentTotal = CompanyIncident::count();

        return [
            Stat::make('加盟会社数', number_format($companyTotal) . ' 社')
                ->description('承認済み ' . number_format($companyApproved) . ' 社')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->chart($companySeries)
                ->color('primary'),

            Stat::make('募集中の案件', number_format($recruiting) . ' 件')
                ->description('累計掲載 ' . number_format($jobsTotal) . ' 件')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->chart($jobsSeries)
                ->color('info'),

            Stat::make('今月の応募', number_format($appThis) . ' 件')
                ->description($appDesc)
                ->descriptionIcon($appIcon)
                ->chart($appSeries)
                ->color('warning'),

            Stat::make('今月の成約', number_format($conThis) . ' 件')
                ->description($conDesc)
                ->descriptionIcon($conIcon)
                ->chart($conSeries)
                ->color('success'),

            Stat::make('未収金', '¥' . number_format($receivable))
                ->description('入金未完了 ' . number_format($receivableCount) . ' 件')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color($receivable > 0 ? 'danger' : 'gray'),

            Stat::make('事故・クレーム（対応中）', number_format($openIncidents) . ' 件')
                ->description('累計 ' . number_format($incidentTotal) . ' 件')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($openIncidents > 0 ? 'warning' : 'gray'),
        ];
    }
}
