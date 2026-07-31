<?php

namespace App\Filament\Resources\MovingJobs\Concerns;

/**
 * 引越予定時間（time_slot）の合成・分解。
 * フォームの入力（午前/午後/フリー便/時間帯の開始〜終了）を1つの文字列に合成し、
 * 編集時は既存の文字列から各入力へ復元する。
 */
trait HandlesTimeSlot
{
    /** フォーム入力 → time_slot 文字列に合成し、仮想フィールドを除去する */
    protected function composeTimeSlot(array $data): array
    {
        $period = $data['t_period'] ?? '';

        // 「指定なし」は時間帯の入力を一切採用しない
        if (blank($period)) {
            $data['time_slot'] = null;
            unset($data['t_period'], $data['t_range'], $data['t_from'], $data['t_to']);

            return $data;
        }

        $parts = [];

        // 時間区分（午前 / 午後 / フリー便）はラジオの単一選択
        if (in_array($period, ['午前', '午後', 'フリー便'], true)) {
            $parts[] = $period;
        }

        // 時間帯（開始〜終了）はチェック時のみ
        if (! empty($data['t_range'])) {
            $from = $this->toHm($data['t_from'] ?? null);
            $to = $this->toHm($data['t_to'] ?? null);
            if ($from && $to) {
                $parts[] = $from . '〜' . $to;
            }
        }

        $data['time_slot'] = $parts ? implode('・', $parts) : null;

        unset($data['t_period'], $data['t_range'], $data['t_from'], $data['t_to']);

        return $data;
    }

    /** time_slot 文字列 → フォーム入力へ分解する */
    protected function decomposeTimeSlot(array $data): array
    {
        $slot = (string) ($data['time_slot'] ?? '');

        $hasRange = (bool) preg_match('/(\d{1,2}:\d{2})\s*[〜~\-]\s*(\d{1,2}:\d{2})/u', $slot, $m);

        if (str_contains($slot, '午前')) {
            $data['t_period'] = '午前';
        } elseif (str_contains($slot, '午後')) {
            $data['t_period'] = '午後';
        } elseif (str_contains($slot, 'フリー便')) {
            $data['t_period'] = 'フリー便';
        } elseif ($hasRange) {
            $data['t_period'] = 'range';
        } else {
            $data['t_period'] = '';
        }

        if ($hasRange) {
            $data['t_range'] = true;
            $data['t_from'] = $m[1];
            $data['t_to'] = $m[2];
        } else {
            $data['t_range'] = false;
            $data['t_from'] = null;
            $data['t_to'] = null;
        }

        return $data;
    }

    /** 時刻文字列から H:i（例 9:05）を取り出す */
    private function toHm($value): ?string
    {
        if (blank($value)) {
            return null;
        }
        if (preg_match('/(\d{1,2}):(\d{2})/', (string) $value, $m)) {
            return ltrim($m[1], '0') === '' ? '0:' . $m[2] : ((int) $m[1]) . ':' . $m[2];
        }

        return null;
    }
}
