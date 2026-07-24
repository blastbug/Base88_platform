<?php

namespace App\Filament\Resources\MovingJobs\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class MovingJobForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('company_id')
                    ->relationship('company', 'name')
                    ->required(),
                DatePicker::make('moving_date')
                    ->required(),
                TextInput::make('time_slot'),
                TextInput::make('from_prefecture')
                    ->required(),
                TextInput::make('from_city'),
                TextInput::make('to_prefecture')
                    ->required(),
                TextInput::make('to_city'),
                TextInput::make('building_type')
                    ->required(),
                TextInput::make('layout'),
                TextInput::make('luggage_volume')
                    ->required(),
                TextInput::make('truck_size'),
                TextInput::make('worker_count')
                    ->numeric(),
                TextInput::make('floors'),
                Toggle::make('has_elevator'),
                TextInput::make('desired_price')
                    ->numeric()
                    ->prefix('$'),
                Textarea::make('note')
                    ->columnSpanFull(),
                DateTimePicker::make('application_deadline')
                    ->required(),
                TextInput::make('status')
                    ->required()
                    ->default('recruiting'),
            ]);
    }
}
