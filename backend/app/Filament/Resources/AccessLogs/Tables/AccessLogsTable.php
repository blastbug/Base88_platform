<?php

namespace App\Filament\Resources\AccessLogs\Tables;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Spatie\Activitylog\Models\Activity;

class AccessLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')->label('日時')->dateTime('Y/m/d H:i:s')->sortable(),

                TextColumn::make('kind')->label('種別')->badge()
                    ->getStateUsing(function (Activity $r): string {
                        $t = data_get($r->properties, 'type');
                        if (! $t) {
                            $t = $r->log_name === 'operation' ? 'operation' : 'その他';
                        }

                        return match ($t) {
                            'login' => 'ログイン',
                            'logout' => 'ログアウト',
                            'register' => '登録申請',
                            'operation' => '業務操作',
                            default => (string) $t,
                        };
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'ログイン' => 'success',
                        'ログアウト' => 'gray',
                        '登録申請' => 'info',
                        '業務操作' => 'warning',
                        default => 'gray',
                    }),

                TextColumn::make('description')->label('内容')->wrap()->searchable(),

                TextColumn::make('user')->label('ユーザー')
                    ->getStateUsing(fn (Activity $r) => $r->causer?->email ?? data_get($r->properties, 'email', '—'))
                    ->description(fn (Activity $r) => $r->causer?->name)
                    ->searchable(query: fn ($query, string $search) => $query),

                TextColumn::make('role')->label('役割')
                    ->getStateUsing(fn (Activity $r) => data_get($r->properties, 'role', '—')),

                TextColumn::make('company')->label('会社')
                    ->getStateUsing(fn (Activity $r) => data_get($r->properties, 'company', '—')),

                TextColumn::make('ip')->label('IP')
                    ->getStateUsing(fn (Activity $r) => data_get($r->properties, 'ip', '—')),

                TextColumn::make('log_name')->label('区分')->badge()
                    ->formatStateUsing(fn (?string $s) => $s === 'access' ? 'アクセス' : ($s === 'operation' ? '業務操作' : ($s ?? '—')))
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('event')->label('種別')->options([
                    'login' => 'ログイン',
                    'logout' => 'ログアウト',
                    'register' => '登録申請',
                ]),
                SelectFilter::make('log_name')->label('区分')->options([
                    'access' => 'アクセス（ログイン等）',
                    'operation' => '業務操作',
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
