<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Enums\Width;
use Filament\View\PanelsRenderHook;
use Illuminate\Support\HtmlString;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->brandName('BASE88 管理')
            // コンテンツを全幅で表示（既定の max-w-7xl だとワイド画面で
            // 左右に大きな余白が出るため）。
            ->maxContentWidth(Width::Full)
            // サイドバーとメインコンテンツの境界を視覚的に明確化する。
            ->renderHook(
                PanelsRenderHook::HEAD_END,
                fn (): HtmlString => new HtmlString(<<<'HTML'
                    <style>
                      /* 左ナビとメイン領域を区別：ナビは白＋右境界線、メインは薄いグレー */
                      .fi-sidebar { background-color: #ffffff; border-right: 1px solid rgb(226 232 240); }
                      .fi-main-ctn { background-color: rgb(248 250 252); }
                      .fi-topbar > * { border-bottom: 1px solid rgb(226 232 240); }
                      .dark .fi-sidebar { background-color: rgb(15 23 42); border-right-color: rgb(30 41 59); }
                      .dark .fi-main-ctn { background-color: rgb(2 6 23); }
                      .dark .fi-topbar > * { border-bottom-color: rgb(30 41 59); }
                    </style>
                    HTML)
            )
            ->colors([
                'primary' => Color::Blue,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->widgets([
                \App\Filament\Widgets\AdminStats::class,
                \App\Filament\Widgets\JobsTrendChart::class,
                \App\Filament\Widgets\ContractsTrendChart::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
