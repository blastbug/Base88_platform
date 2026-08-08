<x-filament-panels::page>
    @php $rows = $this->rows(); $sum = collect($rows); @endphp

    <div class="cs-wrap">
        <div class="cs-filter">
            <label for="cs-company">加盟会社で絞り込み</label>
            <select id="cs-company" wire:model.live="companyId">
                <option value="">すべての加盟会社</option>
                @foreach ($this->companies() as $id => $name)
                    <option value="{{ $id }}">{{ $name }}</option>
                @endforeach
            </select>
        </div>

        <div class="cs-scroll">
            <table class="cs-table">
                <thead>
                    <tr>
                        <th>加盟会社名</th>
                        <th>対象月</th>
                        <th class="num">案件件数</th>
                        <th class="num">売上金額</th>
                        <th class="num">代行集金額</th>
                        <th class="num">追加料金</th>
                        <th class="num">請求金額</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($rows as $r)
                        <tr>
                            <td class="name">{{ $r['company'] }}</td>
                            <td>{{ $r['month'] }}</td>
                            <td class="num">{{ number_format($r['count']) }} 件</td>
                            <td class="num money">¥{{ number_format($r['sales']) }}</td>
                            <td class="num">¥{{ number_format($r['collected']) }}</td>
                            <td class="num">¥{{ number_format($r['additional']) }}</td>
                            <td class="num">¥{{ number_format($r['billing']) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="empty">売上データがありません。</td></tr>
                    @endforelse
                </tbody>
                @if ($sum->isNotEmpty())
                    <tfoot>
                        <tr>
                            <td colspan="2" class="total-label">合計</td>
                            <td class="num">{{ number_format($sum->sum('count')) }} 件</td>
                            <td class="num money">¥{{ number_format($sum->sum('sales')) }}</td>
                            <td class="num">¥{{ number_format($sum->sum('collected')) }}</td>
                            <td class="num">¥{{ number_format($sum->sum('additional')) }}</td>
                            <td class="num">¥{{ number_format($sum->sum('billing')) }}</td>
                        </tr>
                    </tfoot>
                @endif
            </table>
        </div>
    </div>

    <style>
        .cs-wrap { --cs-border: #e2e8f0; --cs-head: #1f2937; --cs-bg: #ffffff; --cs-ink: #1f2937; --cs-muted: #64748b; --cs-zebra: #f8fafc; --cs-total: #eef2f7; }
        .dark .cs-wrap { --cs-border: #334155; --cs-head: #0f172a; --cs-bg: #1e293b; --cs-ink: #e2e8f0; --cs-muted: #94a3b8; --cs-zebra: #172033; --cs-total: #172033; }
        .cs-filter { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .cs-filter label { font-size: 13px; font-weight: 600; color: var(--cs-muted); }
        .cs-filter select { min-width: 240px; padding: 8px 12px; border: 1px solid var(--cs-border); border-radius: 10px; background: var(--cs-bg); color: var(--cs-ink); font-size: 14px; }
        .cs-scroll { overflow-x: auto; border: 1px solid var(--cs-border); border-radius: 12px; }
        .cs-table { width: 100%; border-collapse: collapse; font-size: 14px; color: var(--cs-ink); background: var(--cs-bg); }
        .cs-table thead th { background: var(--cs-head); color: #fff; font-weight: 700; text-align: left; padding: 11px 14px; white-space: nowrap; font-size: 13px; }
        .cs-table th.num, .cs-table td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .cs-table tbody td { padding: 10px 14px; border-top: 1px solid var(--cs-border); }
        .cs-table tbody tr:nth-child(even) { background: var(--cs-zebra); }
        .cs-table td.name { font-weight: 600; }
        .cs-table td.money { font-weight: 700; }
        .cs-table td.empty { text-align: center; color: var(--cs-muted); padding: 28px; }
        .cs-table tfoot td { padding: 11px 14px; border-top: 2px solid var(--cs-border); background: var(--cs-total); font-weight: 700; }
        .cs-table tfoot .total-label { text-align: right; }
    </style>
</x-filament-panels::page>
