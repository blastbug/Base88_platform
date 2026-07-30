<?php

namespace App\Filament\Resources\ActivityLogs;

use App\Filament\Resources\ActivityLogs\Pages\ListActivityLogs;
use App\Filament\Resources\ActivityLogs\Tables\ActivityLogsTable;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Activitylog\Models\Activity;

class ActivityLogResource extends Resource
{
    protected static ?string $model = Activity::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentCheck;

    protected static ?string $navigationLabel = '操作ログ';

    protected static string|\UnitEnum|null $navigationGroup = '運営・設定';

    protected static ?string $modelLabel = '操作ログ';

    protected static ?string $pluralModelLabel = '操作ログ';

    protected static ?int $navigationSort = 5;

    public static function canCreate(): bool
    {
        return false;
    }

    /** 運営者向けの操作ログは業務操作のみ表示（ログイン等のアクセスログは除外し、
     *  開発者専用の「アクセス・活動ログ」でのみ参照する）。 */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('log_name', 'operation');
    }

    public static function table(Table $table): Table
    {
        return ActivityLogsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListActivityLogs::route('/'),
        ];
    }
}
