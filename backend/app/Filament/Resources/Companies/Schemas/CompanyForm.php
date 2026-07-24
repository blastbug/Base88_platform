<?php

namespace App\Filament\Resources\Companies\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class CompanyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('address'),
                TextInput::make('phone')
                    ->tel(),
                TextInput::make('corporate_number'),
                TextInput::make('invoice_number'),
                TextInput::make('status')
                    ->required()
                    ->default('pending'),
                DateTimePicker::make('approved_at'),
            ]);
    }
}
