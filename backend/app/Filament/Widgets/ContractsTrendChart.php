<?php

namespace App\Filament\Widgets;

use App\Models\JobContract;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class ContractsTrendChart extends ChartWidget
{
    protected ?string $heading = '成約数の推移（過去6ヶ月）';

    protected static bool $isLazy = false;

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
                'backgroundColor' => '#60a5fa',
                'borderRadius' => 4,
            ]],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
