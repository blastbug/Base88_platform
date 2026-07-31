@php
    // 開始・終了時刻の候補（30分刻み）
    $timeOptions = [];
    for ($h = 0; $h < 24; $h++) {
        foreach (['00', '30'] as $m) {
            $timeOptions[] = sprintf('%02d:%s', $h, $m);
        }
    }
@endphp

<x-dynamic-component :component="$getFieldWrapperView()" :field="$field">
    <div
        x-data="{
            state: $wire.$entangle('{{ $getStatePath() }}'),
            category: 'am',
            specify: true,
            from: '08:00',
            to: '12:00',
            init() {
                const v = (this.state ?? '').toString().trim();
                const sep = v.includes('〜') ? '〜' : (v.includes('~') ? '~' : null);
                if (v === '午前' || v === '午前指定') this.category = 'am';
                else if (v === '午後' || v === '午後指定') this.category = 'pm';
                else if (v === 'フリー便' || v === '指定なし' || v === '終日') this.category = 'free';
                else if (sep && /\d{1,2}:\d{2}/.test(v)) {
                    this.category = 'custom';
                    const parts = v.split(sep);
                    this.from = (parts[0] || '08:00').trim();
                    this.to = (parts[1] || '12:00').trim();
                    this.specify = true;
                } else if (v === '時間帯指定' || v === '時間指定する' || v === '時間指定') {
                    this.category = 'custom';
                } else if (v === '') {
                    this.category = 'am';
                } else {
                    // 想定外の自由入力はカスタム扱い
                    this.category = 'custom';
                }
                this.sync();
            },
            pick(c) { this.category = c; if (c === 'custom') this.specify = true; this.sync(); },
            sync() {
                if (this.category === 'am') this.state = '午前';
                else if (this.category === 'pm') this.state = '午後';
                else if (this.category === 'free') this.state = 'フリー便';
                else this.state = (this.specify && this.from && this.to) ? (this.from + '〜' + this.to) : '';
            },
        }"
        x-init="init()"
        class="b88-timeslot"
    >
        <div class="b88-ts-btns">
            <button type="button" class="b88-ts-btn" :class="{ 'is-on': category === 'am' }" @click="pick('am')">
                <span class="b88-ts-check" x-show="category === 'am'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="b88-ts-t">午前</span>
                <span class="b88-ts-s">8:00〜12:00頃</span>
            </button>
            <button type="button" class="b88-ts-btn" :class="{ 'is-on': category === 'pm' }" @click="pick('pm')">
                <span class="b88-ts-check" x-show="category === 'pm'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="b88-ts-t">午後</span>
                <span class="b88-ts-s">12:00〜18:00頃</span>
            </button>
            <button type="button" class="b88-ts-btn" :class="{ 'is-on': category === 'free' }" @click="pick('free')">
                <span class="b88-ts-check" x-show="category === 'free'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="b88-ts-t">フリー便</span>
                <span class="b88-ts-s">時間指定なし</span>
            </button>
            <button type="button" class="b88-ts-btn" :class="{ 'is-on': category === 'custom' }" @click="pick('custom')">
                <span class="b88-ts-check" x-show="category === 'custom'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="b88-ts-t">時間指定する</span>
                <span class="b88-ts-s">時間を指定</span>
            </button>
        </div>

        <p class="b88-ts-help">時間帯を「時間指定する」にすると、開始・終了時刻を入力できます。</p>

        <div class="b88-ts-panel" x-show="category === 'custom'" x-collapse>
            <label class="b88-ts-panelhead">
                <input type="checkbox" x-model="specify" @change="sync()">
                <span>時間帯を指定する</span>
            </label>
            <div class="b88-ts-times" x-show="specify" x-collapse.duration.200ms>
                <div class="b88-ts-field">
                    <span class="b88-ts-lbl">開始時刻</span>
                    <div class="b88-ts-select">
                        <svg class="b88-ts-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <select x-model="from" @change="sync()">
                            @foreach ($timeOptions as $t)
                                <option value="{{ $t }}">{{ $t }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <span class="b88-ts-tilde">〜</span>
                <div class="b88-ts-field">
                    <span class="b88-ts-lbl">終了時刻</span>
                    <div class="b88-ts-select">
                        <svg class="b88-ts-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <select x-model="to" @change="sync()">
                            @foreach ($timeOptions as $t)
                                <option value="{{ $t }}">{{ $t }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .b88-timeslot { --b88-brand: #2563eb; --b88-brand-soft: #eff4ff; --b88-border: #e2e8f0; --b88-bg: #ffffff; --b88-ink: #1f2937; --b88-muted: #6b7280; }
        .dark .b88-timeslot { --b88-brand: #7aa2ff; --b88-brand-soft: rgba(122,162,255,.12); --b88-border: #3f4b5e; --b88-bg: #1f2937; --b88-ink: #e5e7eb; --b88-muted: #9aa6b8; }

        .b88-ts-btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 640px) { .b88-ts-btns { grid-template-columns: repeat(2, 1fr); } }
        .b88-ts-btn {
            position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px;
            padding: 11px 8px; border: 1px solid var(--b88-border); border-radius: 12px; background: var(--b88-bg);
            cursor: pointer; text-align: center; transition: border-color .15s, box-shadow .15s, background .15s; min-width: 0;
        }
        .b88-ts-btn:hover { border-color: #c7d2e5; }
        .dark .b88-ts-btn:hover { border-color: #55627a; }
        .b88-ts-btn.is-on { border-color: var(--b88-brand); background: var(--b88-brand-soft); box-shadow: 0 0 0 1px var(--b88-brand); }
        .b88-ts-t { font-weight: 700; font-size: 13.5px; color: var(--b88-ink); white-space: nowrap; }
        .b88-ts-btn.is-on .b88-ts-t { color: var(--b88-brand); }
        .b88-ts-s { font-size: 10.5px; color: var(--b88-muted); white-space: nowrap; letter-spacing: -.02em; }
        .b88-ts-check { position: absolute; top: 8px; right: 8px; width: 16px; height: 16px; border-radius: 999px; background: var(--b88-brand); color: #fff; display: grid; place-items: center; }
        .b88-ts-check svg { width: 10px; height: 10px; }

        .b88-ts-help { margin: 10px 2px 0; font-size: 12px; color: var(--b88-muted); }

        .b88-ts-panel { margin-top: 12px; border: 1px solid var(--b88-border); border-radius: 12px; padding: 14px 16px; background: color-mix(in srgb, var(--b88-bg) 96%, #000 4%); }
        .b88-ts-panelhead { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: var(--b88-ink); cursor: pointer; }
        .b88-ts-panelhead input { width: 16px; height: 16px; accent-color: var(--b88-brand); cursor: pointer; }
        .b88-ts-times { display: flex; align-items: flex-end; gap: 14px; margin-top: 14px; flex-wrap: wrap; }
        .b88-ts-field { display: flex; flex-direction: column; gap: 6px; }
        .b88-ts-lbl { font-size: 12px; font-weight: 600; color: var(--b88-muted); }
        .b88-ts-select { position: relative; }
        .b88-ts-clock { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--b88-muted); pointer-events: none; }
        .b88-ts-select select {
            appearance: auto; min-width: 150px; padding: 9px 12px 9px 34px; font-size: 14px; color: var(--b88-ink);
            border: 1px solid var(--b88-border); border-radius: 10px; background: var(--b88-bg); cursor: pointer;
        }
        .b88-ts-select select:focus { outline: none; border-color: var(--b88-brand); box-shadow: 0 0 0 1px var(--b88-brand); }
        .b88-ts-tilde { padding-bottom: 9px; font-size: 16px; color: var(--b88-muted); }
    </style>
</x-dynamic-component>
