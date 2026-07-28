<?php

namespace App\Filament\Pages;

use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;

class SystemSettings extends Page
{
    protected string $view = 'filament.pages.system-settings';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    protected static ?string $navigationLabel = 'システム設定';

    protected static string|\UnitEnum|null $navigationGroup = '運営・設定';

    protected static ?string $title = 'システム設定';

    protected static ?int $navigationSort = 9;
}
