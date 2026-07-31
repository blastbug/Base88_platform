<?php

namespace App\Filament\Resources\CompanyIncidents\Schemas;

use App\Models\CompanyIncident;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CompanyIncidentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('事故・クレーム情報')
                    ->icon('heroicon-o-exclamation-triangle')
                    ->columns(2)
                    ->schema([
                        Select::make('company_id')->label('加盟店')
                            ->relationship('company', 'name')->searchable()->preload()->required(),
                        Select::make('type')->label('種別')
                            ->options(CompanyIncident::TYPE_LABELS)->native(false)->required(),
                        Select::make('moving_job_id')->label('関連案件')
                            ->relationship('movingJob', 'job_code')->searchable()->preload()
                            ->helperText('該当する案件があれば選択してください（任意）'),
                        DatePicker::make('occurred_on')->label('発生日')->native(false),
                        TextInput::make('title')->label('件名')->required()->columnSpanFull(),
                        Textarea::make('description')->label('詳細')->rows(3)->columnSpanFull(),
                        TextInput::make('damage_amount')->label('損害額・未収額')->numeric()->prefix('¥'),
                    ]),

                Section::make('対応状況')
                    ->icon('heroicon-o-check-circle')
                    ->columns(2)
                    ->schema([
                        Select::make('status')->label('ステータス')
                            ->options(CompanyIncident::STATUS_LABELS)
                            ->default(CompanyIncident::STATUS_OPEN)->native(false)->required(),
                        Textarea::make('resolution')->label('対応内容')->rows(2)->columnSpanFull(),
                    ]),
            ]);
    }
}
