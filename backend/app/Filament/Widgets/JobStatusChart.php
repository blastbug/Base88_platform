<?php

namespace App\Filament\Widgets;

use App\Models\MovingJob;
use Filament\Support\RawJs;
use Filament\Widgets\ChartWidget;

class JobStatusChart extends ChartWidget
{
    protected ?string $heading = '案件ステータス内訳';

    protected ?string $description = '掲載中の全案件の状況';

    protected static bool $isLazy = false;

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 1;

    protected function getData(): array
    {
        $map = [
            ['募集中', MovingJob::STATUS_RECRUITING, '#22c55e'],
            ['成約済', MovingJob::STATUS_CONTRACTED, '#3b82f6'],
            ['完了', MovingJob::STATUS_COMPLETED, '#64748b'],
            ['募集終了', MovingJob::STATUS_CLOSED, '#f59e0b'],
            ['キャンセル', MovingJob::STATUS_CANCELLED, '#ef4444'],
        ];

        $counts = MovingJob::query()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $labels = [];
        $data = [];
        $colors = [];
        foreach ($map as [$label, $status, $color]) {
            $labels[] = $label;
            $data[] = (int) ($counts[$status] ?? 0);
            $colors[] = $color;
        }

        return [
            'datasets' => [[
                'data' => $data,
                'backgroundColor' => $colors,
                'borderColor' => '#ffffff',
                'borderWidth' => 2,
                'hoverOffset' => 8,
            ]],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }

    protected function getMaxHeight(): ?string
    {
        return '280px';
    }

    protected function getOptions(): RawJs
    {
        return RawJs::make(<<<'JS'
        {
            cutout: '66%',
            animation: { animateRotate: true, duration: 1100, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#475569',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 14,
                        font: { size: 13 },
                    },
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    cornerRadius: 10,
                    titleColor: '#e2e8f0',
                    bodyColor: '#ffffff',
                },
            },
        }
        JS);
    }
}
