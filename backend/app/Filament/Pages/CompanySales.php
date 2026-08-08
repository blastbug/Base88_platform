<?php

namespace App\Filament\Pages;

use App\Models\Company;
use App\Models\JobFinance;
use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;

/**
 * 加盟会社別 売上（月別）。
 * 加盟会社ごと・対象月ごとに 案件件数／売上／代行集金／追加料金／請求 を集計表示。
 * 集計は DB 非依存となるよう PHP 側で行う。
 */
class CompanySales extends Page
{
    protected string $view = 'filament.pages.company-sales';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChartBar;

    protected static ?string $navigationLabel = '加盟会社別売上';

    protected static string|\UnitEnum|null $navigationGroup = '業務管理';

    protected static ?string $title = '加盟会社別 売上';

    protected static ?int $navigationSort = 7;

    /** 絞り込み対象の加盟会社（null は全社） */
    public ?int $companyId = null;

    /** 絞り込み用の加盟会社リスト */
    public function companies(): array
    {
        return Company::orderBy('name')->pluck('name', 'id')->all();
    }

    /** 加盟会社×対象月で集計した行 */
    public function rows(): array
    {
        $finances = JobFinance::with('company')
            ->when($this->companyId, fn ($q) => $q->where('company_id', $this->companyId))
            ->get();

        return $finances
            ->groupBy(fn ($f) => $f->company_id.'|'.(optional($f->settled_month)->format('Y-m') ?? '0000-00'))
            ->map(function ($g) {
                $first = $g->first();

                return [
                    'company' => $first->company?->name ?? '—',
                    'ym' => optional($first->settled_month)->format('Y-m') ?? '—',
                    'month' => optional($first->settled_month)->format('Y年n月') ?? '—',
                    'count' => $g->count(),
                    'sales' => (int) $g->sum('sale_amount'),
                    'collected' => (int) $g->sum('collected_amount'),
                    'additional' => (int) $g->sum('additional_amount'),
                    'billing' => (int) $g->sum('billing_amount'),
                ];
            })
            ->sortBy([['company', 'asc'], ['ym', 'desc']])
            ->values()
            ->all();
    }
}
