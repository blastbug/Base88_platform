<?php

namespace App\Filament\Widgets;

use App\Models\MovingJob;
use Filament\Support\RawJs;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class JobsTrendChart extends ChartWidget
{
    protected ?string $heading = '案件数の推移（過去6ヶ月）';

    protected static bool $isLazy = false;

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 1;

    protected function getData(): array
    {
        [$labels, $values] = $this->monthlyCounts(fn (Carbon $start, Carbon $end) => MovingJob::whereBetween('created_at', [$start, $end])->count());

        return [
            'datasets' => [[
                'label' => '案件数',
                'data' => $values,
                'borderColor' => '#2563eb',
                'backgroundColor' => 'rgba(37, 99, 235, 0.12)',
                'fill' => true,
                'tension' => 0.4,
                'borderWidth' => 3,
                'pointBackgroundColor' => '#2563eb',
                'pointBorderColor' => '#ffffff',
                'pointBorderWidth' => 2,
                'pointRadius' => 4,
                'pointHoverRadius' => 7,
            ]],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }

    protected function getOptions(): RawJs
    {
        return RawJs::make(<<<'JS'
        {
            animation: { duration: 1400, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    cornerRadius: 10,
                    titleColor: '#e2e8f0',
                    bodyColor: '#ffffff',
                    displayColors: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148,163,184,0.15)' },
                    border: { display: false },
                    ticks: { precision: 0, color: '#94a3b8' },
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: '#94a3b8' },
                },
            },
        }
        JS);
    }

    /** @return array{0: string[], 1: int[]} */
    protected function monthlyCounts(callable $counter): array
    {
        $labels = [];
        $values = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $labels[] = $month->format('n') . '月';
            $values[] = $counter($month->copy()->startOfMonth(), $month->copy()->endOfMonth());
        }

        return [$labels, $values];
    }
}
