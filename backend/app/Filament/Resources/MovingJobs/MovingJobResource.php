<?php

namespace App\Filament\Resources\MovingJobs;

use App\Filament\Resources\MovingJobs\Pages\CreateMovingJob;
use App\Filament\Resources\MovingJobs\Pages\EditMovingJob;
use App\Filament\Resources\MovingJobs\Pages\ListMovingJobs;
use App\Filament\Resources\MovingJobs\Schemas\MovingJobForm;
use App\Filament\Resources\MovingJobs\Tables\MovingJobsTable;
use App\Models\MovingJob;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class MovingJobResource extends Resource
{
    protected static ?string $model = MovingJob::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static ?string $navigationLabel = '案件管理';

    protected static ?string $modelLabel = '案件';

    protected static ?string $pluralModelLabel = '案件';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return MovingJobForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MovingJobsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMovingJobs::route('/'),
            'create' => CreateMovingJob::route('/create'),
            'edit' => EditMovingJob::route('/{record}/edit'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
