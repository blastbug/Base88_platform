<?php

namespace App\Filament\Widgets;

use App\Models\MovingJob;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class JobsTrendChart extends ChartWidget
{
    protected ?string $heading = '案件数の推移（過去6ヶ月）';

    protected static bool $isLazy = false;

    protected int|string|array $columnSpan = 1;

    protected function getData(): array
    {
        [$labels, $values] = $this->monthlyCounts(fn (Carbon $start, Carbon $end) => MovingJob::whereBetween('created_at', [$start, $end])->count());

        return [
            'datasets' => [[
                'label' => '案件数',
                'data' => $values,
                'borderColor' => '#2563eb',
                'backgroundColor' => 'rgba(37, 99, 235, 0.1)',
                'fill' => true,
                'tension' => 0.35,
            ]],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
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
