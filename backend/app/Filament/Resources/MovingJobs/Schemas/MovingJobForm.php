<?php

namespace App\Filament\Resources\MovingJobs\Schemas;

use App\Models\MovingJob;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\ViewField;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class MovingJobForm
{
    private const PREFECTURES = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
    ];

    private const BUILDING_TYPES = ['アパート', 'マンション', 'タワーマンション', '戸建て', 'オフィス', 'その他'];

    private const TRUCK_SIZES = ['軽トラック', '1トン', '2トンショート', '2トンロング', '3トン', '4トン', 'その他'];

    private const LAYOUTS = ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3K', '3DK', '3LDK', '4K', '4DK', '4LDK', '5LDK以上', 'その他'];

    /** 値＝ラベルの選択肢に整形 */
    private static function opts(array $list): array
    {
        return array_combine($list, $list);
    }

    public static function configure(Schema $schema): Schema
    {
        // フォームは2カラム。左に「掲載会社・日程（時間区分を含む）」、
        // 右に「引越場所」と「荷物・作業条件」を縦に並べ、
        // その下に「金額・募集状況」を全幅で配置する。
        return $schema
            ->components([
                // ===== 左カラム：掲載会社・日程（時間区分を内包した1ブロック） =====
                Section::make('掲載会社・日程')
                    ->icon('heroicon-o-calendar-days')
                    ->columns(2)
                    ->columnSpan(1)
                    ->extraAttributes(['class' => 'b88-jobcol b88-jobcol-left'])
                    ->schema([
                        TextInput::make('job_code')->label('案件ID（管理者任意）')
                            ->placeholder('例: T-2026-0815-001')
                            ->helperText('任意の番号を入力してください。未入力の場合は自動採番されます。重複する番号は登録できません。')
                            ->hintIcon('heroicon-m-question-mark-circle', tooltip: '空欄なら自動採番。任意の番号を入力することもできます。')
                            ->maxLength(50)
                            ->unique(ignoreRecord: true)
                            ->columnSpanFull(),
                        Select::make('company_id')->label('掲載会社')
                            ->relationship('company', 'name')->searchable()->preload()->required(),
                        DatePicker::make('moving_date')->label('引越予定日')->native(false)->required(),
                        DateTimePicker::make('application_deadline')->label('応募締切')->native(false)->required()
                            ->helperText('この日時を過ぎると自動で募集を終了します。')
                            ->columnSpanFull(),
                        ViewField::make('time_slot')->label('引越予定時間（時間区分）')
                            ->view('filament.forms.components.time-slot')
                            ->required()
                            ->columnSpanFull(),
                    ]),

                // ===== 右カラム：引越場所 → 荷物・作業条件（縦積み） =====
                Group::make([
                    Section::make('引越場所')
                        ->icon('heroicon-o-map-pin')
                        ->columns(2)
                        ->schema([
                            Select::make('from_prefecture')->label('出発地（都道府県）')
                                ->options(self::opts(self::PREFECTURES))->searchable()->native(false)->required(),
                            TextInput::make('from_city')->label('出発地（市区町村）'),
                            Select::make('to_prefecture')->label('到着地（都道府県）')
                                ->options(self::opts(self::PREFECTURES))->searchable()->native(false)->required(),
                            TextInput::make('to_city')->label('到着地（市区町村）'),
                        ]),

                    Section::make('荷物・作業条件')
                        ->icon('heroicon-o-cube')
                        ->columns(3)
                        ->extraAttributes(['class' => 'b88-jobsec-grow'])
                        ->schema([
                            Select::make('building_type')->label('建物種別')
                                ->options(self::opts(self::BUILDING_TYPES))->native(false)->required(),
                            Select::make('layout')->label('間取り')
                                ->options(self::opts(self::LAYOUTS))->native(false),
                            TextInput::make('luggage_volume')->label('荷物量')->required()->placeholder('例: 2tトラック1台程度'),
                            Select::make('truck_size')->label('トラックサイズ')
                                ->options(self::opts(self::TRUCK_SIZES))->native(false),
                            TextInput::make('worker_count')->label('必要人数')->numeric()->suffix('名'),
                            TextInput::make('floors')->label('階数')->placeholder('例: 2階'),
                            Textarea::make('note')->label('備考・特記事項')
                                ->placeholder('例）エレベーターあり、養生必須 など')
                                ->rows(3)->maxLength(500)->columnSpanFull(),
                        ]),
                ])->columnSpan(1)->extraAttributes(['class' => 'b88-jobcol b88-jobcol-right']),

                // ===== 全幅：金額・募集状況 =====
                Section::make('金額・募集状況')
                    ->icon('heroicon-o-banknotes')
                    ->columns(2)
                    ->columnSpanFull()
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
                    ]),
            ]);
    }
}
