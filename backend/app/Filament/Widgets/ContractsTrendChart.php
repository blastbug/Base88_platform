<?php

namespace App\Filament\Widgets;

use App\Models\JobContract;
use Filament\Support\RawJs;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class ContractsTrendChart extends ChartWidget
{
    protected ?string $heading = '成約数の推移（過去6ヶ月）';

    protected static bool $isLazy = false;

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    protected function getData(): array
    {
        $labels = [];
        $values = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $labels[] = $month->format('n') . '月';
            $values[] = JobContract::whereBetween('contracted_at', [
                $month->copy()->startOfMonth(),
                $month->copy()->endOfMonth(),
            ])->count();
        }

        return [
            'datasets' => [[
                'label' => '成約数',
                'data' => $values,
                'backgroundColor' => '#3b82f6',
                'hoverBackgroundColor' => '#2563eb',
                'borderRadius' => 8,
                'maxBarThickness' => 46,
            ]],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): RawJs
    {
        return RawJs::make(<<<'JS'
        {
            animation: { duration: 1100, easing: 'easeOutQuart' },
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
}
