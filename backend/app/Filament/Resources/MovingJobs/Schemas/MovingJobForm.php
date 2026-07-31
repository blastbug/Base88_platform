<?php

namespace App\Filament\Resources\MovingJobs\Schemas;

use App\Models\MovingJob;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;

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

                        Fieldset::make('引越予定時間')
                            ->columns(4)
                            ->columnSpanFull()
                            ->schema([
                                Checkbox::make('t_am')->label('午前'),
                                Checkbox::make('t_pm')->label('午後'),
                                Checkbox::make('t_freebin')->label('フリー便'),
                                Checkbox::make('t_range')->label('時間帯を指定する')->live(),
                                TimePicker::make('t_from')->label('開始時刻')
                                    ->seconds(false)->native(false)->format('H:i')->displayFormat('H:i')
                                    ->visible(fn (Get $get): bool => (bool) $get('t_range'))
                                    ->required(fn (Get $get): bool => (bool) $get('t_range')),
                                TimePicker::make('t_to')->label('終了時刻')
                                    ->seconds(false)->native(false)->format('H:i')->displayFormat('H:i')
                                    ->visible(fn (Get $get): bool => (bool) $get('t_range'))
                                    ->required(fn (Get $get): bool => (bool) $get('t_range')),
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
