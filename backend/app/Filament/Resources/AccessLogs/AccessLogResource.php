<?php

namespace App\Filament\Resources\AccessLogs;

use App\Filament\Resources\AccessLogs\Pages\ListAccessLogs;
use App\Filament\Resources\AccessLogs\Tables\AccessLogsTable;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Spatie\Activitylog\Models\Activity;

/**
 * 開発者専用「アクセス・活動ログ」。
 * ログイン・ログアウト・会社登録などを含む全ユーザー活動を表示する。
 * is_developer のアカウントのみ閲覧可能（クライアント＝運営者には非表示・403）。
 */
class AccessLogResource extends Resource
{
    protected static ?string $model = Activity::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-eye';

    protected static ?string $navigationLabel = 'アクセス・活動ログ';

    protected static string|\UnitEnum|null $navigationGroup = '運営・設定';

    protected static ?string $modelLabel = 'アクセス・活動ログ';

    protected static ?string $pluralModelLabel = 'アクセス・活動ログ';

    protected static ?int $navigationSort = 20;

    /** 開発者のみ閲覧可（canAccess の既定はこれを参照＝ナビも非表示になる） */
    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->isDeveloper();
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return AccessLogsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAccessLogs::route('/'),
        ];
    }
}
