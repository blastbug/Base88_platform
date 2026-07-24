<?php

namespace App\Filament\Resources\ActivityLogs\Tables;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ActivityLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')->label('日時')->dateTime('Y/m/d H:i')->sortable(),
                TextColumn::make('description')->label('操作')->searchable(),
                TextColumn::make('subject_type')->label('対象')
                    ->formatStateUsing(fn (?string $state) => $state ? class_basename($state) : '—'),
                TextColumn::make('causer.name')->label('操作者')->default('—'),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
