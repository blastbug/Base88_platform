<?php

namespace App\Filament\Resources\Companies\Schemas;

use App\Models\Company;
use App\Models\CompanyDocument;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CompanyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                // ===== 審査 =====
                Section::make('審査')
                    ->description('登録内容を審査し、ステータスを設定します。修正依頼のコメントは加盟店側にも表示されます。')
                    ->icon('heroicon-o-clipboard-document-check')
                    ->columns(2)
                    ->schema([
                        Select::make('review_status')->label('審査ステータス')
                            ->options(Company::REVIEW_LABELS)
                            ->default(Company::REVIEW_DRAFT)
                            ->native(false)
                            ->required(),
                        DateTimePicker::make('submitted_at')->label('申請日時'),
                        Textarea::make('review_note')->label('修正依頼・審査コメント')
                            ->helperText('修正が必要な項目や理由を記入すると、加盟店側の申請状況ページに表示されます。')
                            ->rows(3)->columnSpanFull(),
                    ]),

                // ===== 1. 会社情報 =====
                Section::make('1. 会社情報')
                    ->icon('heroicon-o-building-office-2')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')->label('会社名')->required(),
                        TextInput::make('name_kana')->label('会社名フリガナ'),
                        TextInput::make('corporate_number')->label('法人番号')->helperText('任意'),
                        TextInput::make('invoice_number')->label('インボイス番号')->helperText('任意'),
                        TextInput::make('postal_code')->label('郵便番号')->placeholder('123-4567'),
                        TextInput::make('address')->label('所在地')->columnSpanFull(),
                        TextInput::make('phone')->label('電話番号')->tel(),
                        TextInput::make('company_email')->label('メールアドレス')->email(),
                        TextInput::make('established_ym')->label('設立年月')->placeholder('2015-04'),
                        TextInput::make('website')->label('会社ホームページ')->url(),
                        TextInput::make('service_areas')->label('対応可能エリア')->columnSpanFull(),
                        TextInput::make('business_hours')->label('営業時間')->placeholder('9:00〜18:00'),
                        TextInput::make('holidays')->label('定休日')->placeholder('日曜・祝日'),
                    ]),

                // ===== 2. 代表者情報 =====
                Section::make('2. 代表者情報')
                    ->icon('heroicon-o-user')
                    ->columns(2)
                    ->collapsible()
                    ->schema([
                        TextInput::make('rep_name')->label('代表者氏名'),
                        TextInput::make('rep_name_kana')->label('代表者氏名フリガナ'),
                        DatePicker::make('rep_birthday')->label('生年月日')->native(false),
                        TextInput::make('rep_address')->label('住所'),
                        TextInput::make('rep_phone')->label('電話番号')->tel(),
                        TextInput::make('rep_email')->label('メールアドレス')->email(),
                    ]),

                // ===== 3. 担当者情報 =====
                Section::make('3. 担当者情報')
                    ->icon('heroicon-o-user-circle')
                    ->columns(2)
                    ->collapsible()
                    ->schema([
                        TextInput::make('contact_name')->label('担当者氏名'),
                        TextInput::make('contact_department')->label('部署名'),
                        TextInput::make('contact_title')->label('役職'),
                        TextInput::make('contact_phone')->label('電話番号')->tel(),
                        TextInput::make('contact_email')->label('メールアドレス')->email(),
                    ]),

                // ===== 4. 会社規模 =====
                Section::make('4. 会社規模')
                    ->icon('heroicon-o-users')
                    ->columns(4)
                    ->collapsible()
                    ->schema([
                        TextInput::make('employee_count')->label('従業員数')->numeric()->suffix('名'),
                        TextInput::make('worker_count')->label('作業員数')->numeric()->suffix('名'),
                        TextInput::make('sales_staff_count')->label('営業担当者数')->numeric()->suffix('名'),
                        TextInput::make('vehicle_count')->label('車両数')->numeric()->suffix('台'),
                    ]),

                // ===== 5. 保有車両情報 =====
                Section::make('5. 保有車両情報')
                    ->icon('heroicon-o-truck')
                    ->collapsible()
                    ->schema([
                        Repeater::make('vehicles')
                            ->label('保有車両')
                            ->relationship()
                            ->columns(3)
                            ->defaultItems(0)
                            ->addActionLabel('車両を追加')
                            ->itemLabel(fn (array $state): ?string => $state['truck_size'] ?? $state['vehicle_type'] ?? '車両')
                            ->schema([
                                TextInput::make('vehicle_type')->label('車両区分'),
                                Select::make('truck_size')->label('トラックサイズ')
                                    ->options([
                                        '軽トラック' => '軽トラック',
                                        '1トントラック' => '1トントラック',
                                        '2トンショート' => '2トンショート',
                                        '2トンロング' => '2トンロング',
                                        '2トンワイド' => '2トンワイド',
                                        '3トントラック' => '3トントラック',
                                        '4トントラック' => '4トントラック',
                                        'その他' => 'その他',
                                    ])->native(false),
                                TextInput::make('count')->label('台数')->numeric()->default(1),
                                TextInput::make('max_load')->label('最大積載量'),
                                TextInput::make('plate_number')->label('ナンバー'),
                                Select::make('ownership')->label('所有区分')
                                    ->options(['自社所有' => '自社所有', 'リース' => 'リース'])->native(false),
                                TextInput::make('availability')->label('稼働可能状況')->placeholder('稼働可 / 一部稼働 など'),
                            ]),
                    ]),

                // ===== 6. 許可証・本人確認書類 =====
                Section::make('6. 許可証・本人確認書類')
                    ->icon('heroicon-o-identification')
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        Toggle::make('has_antique_license')->label('古物商許可'),
                        Toggle::make('has_light_cargo_license')->label('軽貨物運送事業'),
                        Toggle::make('has_general_cargo_license')->label('一般貨物自動車運送事業'),
                        Repeater::make('documents')
                            ->label('書類（画像・PDF）')
                            ->relationship()
                            ->columns(2)
                            ->columnSpanFull()
                            ->defaultItems(0)
                            ->addActionLabel('書類を追加')
                            ->itemLabel(fn (array $state): ?string => CompanyDocument::TYPES[$state['doc_type'] ?? ''] ?? '書類')
                            ->schema([
                                Select::make('doc_type')->label('書類種別')
                                    ->options(CompanyDocument::TYPES)->required()->native(false),
                                TextInput::make('doc_name')->label('書類名'),
                                TextInput::make('permit_number')->label('許可番号'),
                                DatePicker::make('expiry_date')->label('有効期限')->native(false),
                                FileUpload::make('file_path')->label('画像・PDF')
                                    ->directory('company-documents')
                                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
                                    ->maxSize(10240)
                                    ->downloadable()
                                    ->columnSpanFull(),
                                Select::make('review_status')->label('確認状況')
                                    ->options([
                                        CompanyDocument::REVIEW_PENDING => '確認待ち',
                                        CompanyDocument::REVIEW_CONFIRMED => '確認済み',
                                        CompanyDocument::REVIEW_REJECTED => '差し戻し',
                                    ])->default(CompanyDocument::REVIEW_PENDING)->native(false),
                                TextInput::make('reject_reason')->label('差し戻し理由'),
                            ]),
                    ]),

                // ===== 7. 会社実績 =====
                Section::make('7. 会社実績')
                    ->icon('heroicon-o-chart-bar')
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        TextInput::make('experience_years')->label('経験年数')->numeric()->suffix('年'),
                        TextInput::make('annual_jobs')->label('年間対応件数')->numeric()->suffix('件'),
                        TextInput::make('monthly_capacity')->label('月間対応可能件数')->numeric()->suffix('件'),
                        TextInput::make('peak_capacity')->label('繁忙期の対応可能件数')->numeric()->suffix('件'),
                        Toggle::make('corporate_experience')->label('法人案件の対応実績'),
                        Toggle::make('individual_experience')->label('個人案件の対応実績'),
                        Toggle::make('long_distance_support')->label('長距離引っ越しの対応'),
                        Textarea::make('main_clients')->label('主な取引先')->rows(2)->columnSpanFull(),
                        Textarea::make('achievements')->label('過去の実績・アピール内容')->rows(3)->columnSpanFull(),
                    ]),

                // ===== 8. 保険加入状況 =====
                Section::make('8. 保険加入状況')
                    ->icon('heroicon-o-shield-check')
                    ->columns(2)
                    ->collapsible()
                    ->schema([
                        Toggle::make('has_transport_insurance')->label('運送保険'),
                        Toggle::make('has_cargo_insurance')->label('貨物保険'),
                        Toggle::make('has_liability_insurance')->label('請負業者賠償責任保険'),
                        Toggle::make('has_auto_insurance')->label('自動車保険'),
                        TextInput::make('insurer_name')->label('保険会社名'),
                        TextInput::make('policy_number')->label('保険証券番号'),
                        TextInput::make('coverage_amount')->label('補償金額')->numeric()->prefix('¥'),
                        DatePicker::make('insurance_expiry')->label('保険の有効期限')->native(false),
                    ]),

                // ===== 9. 保有資材 =====
                Section::make('9. 保有資材')
                    ->icon('heroicon-o-cube')
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        TextInput::make('material_hanger_box')->label('ハンガーボックス')->numeric()->suffix('個'),
                        TextInput::make('material_futon_bag')->label('布団袋')->numeric()->suffix('個'),
                        TextInput::make('material_mattress_cover')->label('マットレスカバー')->numeric()->suffix('個'),
                        TextInput::make('material_plastic_sheet')->label('プラ段シート')->numeric()->suffix('枚'),
                        TextInput::make('material_floor_board_m')->label('床養生ボード')->numeric()->suffix('m'),
                    ]),

                // ===== 10. 対応可能サービス =====
                Section::make('10. 対応可能サービス')
                    ->description('不用品引き取りが可能な場合は、6. の古物商許可の有無・許可証もご確認ください。')
                    ->icon('heroicon-o-wrench-screwdriver')
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        Toggle::make('svc_disposal_pickup')->label('不用品引き取り'),
                        Toggle::make('svc_disposal_buy')->label('不用品買取'),
                        Toggle::make('svc_ac_install')->label('エアコン脱着'),
                        Toggle::make('svc_washer_install')->label('洗濯機設置'),
                        Toggle::make('svc_furniture_assembly')->label('家具組立て'),
                        Toggle::make('svc_appliance_install')->label('家電設置'),
                        Toggle::make('svc_packing')->label('梱包作業'),
                        Toggle::make('svc_unpacking')->label('開梱作業'),
                        Toggle::make('svc_protection')->label('養生作業'),
                        Toggle::make('svc_long_distance')->label('長距離配送'),
                        Toggle::make('svc_storage')->label('一時保管'),
                    ]),
            ]);
    }
}
