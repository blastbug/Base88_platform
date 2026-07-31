<?php

namespace App\Filament\Resources\MovingJobs\Schemas;

use App\Models\MovingJob;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Illuminate\Support\HtmlString;

class MovingJobForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('掲載会社・日程')
                    ->icon('heroicon-o-calendar-days')
                    ->columns(2)
                    ->schema([
                        TextInput::make('job_code')->label('案件ID')
                            ->placeholder('空欄の場合は自動発行（例: T-2026-0815-001）')
                            ->helperText('管理者が任意の番号を入力できます。重複する番号は登録できません。空欄なら自動発行されます。')
                            ->maxLength(50)
                            ->unique(ignoreRecord: true)
                            ->columnSpanFull(),
                        Select::make('company_id')->label('掲載会社')
                            ->relationship('company', 'name')->searchable()->preload()->required(),
                        DatePicker::make('moving_date')->label('引越予定日')->native(false)->required(),
                        DateTimePicker::make('application_deadline')->label('応募締切')->native(false)->required(),
                    ]),

                Section::make('引越予定時間')
                    ->icon('heroicon-o-clock')
                    ->columnSpanFull()
                    ->columns(['default' => 1, 'md' => 2])
                    ->schema([
                                // 左：時間区分（単一選択）
                                Radio::make('t_period')->label('時間区分')
                                    ->options([
                                        '' => '指定なし',
                                        '午前' => '午前',
                                        '午後' => '午後',
                                        'range' => '時間帯を指定する',
                                        'フリー便' => 'フリー便',
                                    ])
                                    ->descriptions([
                                        '午前' => '8:00〜12:00頃',
                                        '午後' => '12:00〜18:00頃',
                                        'range' => '開始・終了時刻を入力',
                                        'フリー便' => '時間指定なし',
                                    ])
                                    ->default('')
                                    ->live()
                                    ->afterStateUpdated(function ($state, Set $set): void {
                                        // 区分に応じて時間帯の目安を補完する
                                        match ($state) {
                                            '午前' => [$set('t_range', true), $set('t_from', '8:00'), $set('t_to', '12:00')],
                                            '午後' => [$set('t_range', true), $set('t_from', '12:00'), $set('t_to', '18:00')],
                                            'range' => [$set('t_range', true), $set('t_from', null), $set('t_to', null)],
                                            default => [$set('t_range', false), $set('t_from', null), $set('t_to', null)],
                                        };
                                    }),

                                // 右：時間帯の詳細
                                Group::make()
                                    ->schema([
                                        Checkbox::make('t_range')->label('時間帯を指定する')
                                            ->helperText('開始・終了時刻を入力してください。')
                                            ->live()
                                            ->disabled(fn (Get $get): bool => $get('t_period') === '' || $get('t_period') === null),
                                        Grid::make(2)->schema([
                                            TimePicker::make('t_from')->label('開始時刻')
                                                ->seconds(false)->native(false)->format('H:i')->displayFormat('H:i')
                                                ->prefixIcon('heroicon-m-clock')
                                                ->disabled(fn (Get $get): bool => blank($get('t_period')) || ! $get('t_range'))
                                                ->required(fn (Get $get): bool => filled($get('t_period')) && (bool) $get('t_range'))
                                                ->dehydrated(),
                                            TimePicker::make('t_to')->label('終了時刻')
                                                ->seconds(false)->native(false)->format('H:i')->displayFormat('H:i')
                                                ->prefixIcon('heroicon-m-clock')
                                                ->disabled(fn (Get $get): bool => blank($get('t_period')) || ! $get('t_range'))
                                                ->required(fn (Get $get): bool => filled($get('t_period')) && (bool) $get('t_range'))
                                                ->dehydrated(),
                                        ]),
                                        Placeholder::make('t_note')->hiddenLabel()
                                            ->content(new HtmlString(
                                                '<div style="display:flex;gap:.45rem;align-items:flex-start;padding:.55rem .7rem;border-radius:.5rem;'
                                                . 'background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.25);color:#1d4ed8;font-size:.75rem;line-height:1.5;">'
                                                . '<span style="flex:none;font-weight:700;">ⓘ</span>'
                                                . '<span>目安の時間帯です。詳細な時間指定は、加盟会社への案件開示後に個別でご案内ください。</span></div>'
                                            ))
                                            ->visible(fn (Get $get): bool => filled($get('t_period'))),
                                    ]),
                    ]),

                Section::make('引越場所')
                    ->icon('heroicon-o-map-pin')
                    ->columns(2)
                    ->schema([
                        TextInput::make('from_prefecture')->label('出発地（都道府県）')->required(),
                        TextInput::make('from_city')->label('出発地（市区町村）'),
                        TextInput::make('to_prefecture')->label('到着地（都道府県）')->required(),
                        TextInput::make('to_city')->label('到着地（市区町村）'),
                    ]),

                Section::make('荷物・作業条件')
                    ->icon('heroicon-o-cube')
                    ->columns(3)
                    ->schema([
                        TextInput::make('building_type')->label('建物種別')->required(),
                        TextInput::make('layout')->label('間取り'),
                        TextInput::make('luggage_volume')->label('荷物量')->required(),
                        TextInput::make('truck_size')->label('トラックサイズ'),
                        TextInput::make('worker_count')->label('必要人数')->numeric(),
                        TextInput::make('floors')->label('階数'),
                        Toggle::make('has_elevator')->label('エレベーター有無')->inline(false),
                    ]),

                Section::make('金額・募集状況')
                    ->icon('heroicon-o-banknotes')
                    ->columns(2)
                    ->schema([
                        TextInput::make('desired_price')->label('希望金額')->numeric()->prefix('¥'),
                        Select::make('status')->label('募集状況')
                            ->options([
                                MovingJob::STATUS_RECRUITING => '募集中',
                                MovingJob::STATUS_CLOSED => '募集終了',
                                MovingJob::STATUS_CONTRACTED => '成約済',
                                MovingJob::STATUS_COMPLETED => '完了',
                                MovingJob::STATUS_CANCELLED => 'キャンセル',
                            ])
                            ->default(MovingJob::STATUS_RECRUITING)
                            ->native(false)
                            ->required(),
                        Textarea::make('note')->label('備考')->rows(3)->columnSpanFull(),
                    ]),
            ]);
    }
}
