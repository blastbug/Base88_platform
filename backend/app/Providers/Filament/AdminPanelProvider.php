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
            // SPA モード：画面遷移を wire:navigate の部分更新にする。
            // 既定ではナビが通常リンクでフルページ再読込になり、毎回全アセットを
            // 取り直して遅く・全体が再描画されて見えるため有効化する。
            ->spa()
            // コンテンツを全幅で表示（既定の max-w-7xl だとワイド画面で
            // 左右に大きな余白が出るため）。
            ->maxContentWidth(Width::Full)
            // 管理画面のデザイン刷新（ブランド濃紺サイドバー・質感調整）。
            ->renderHook(
                PanelsRenderHook::HEAD_END,
                fn (): HtmlString => new HtmlString(<<<'HTML'
                    <style>
                      /* ===== ブランド濃紺サイドバー ===== */
                      .fi-main-sidebar { background-color: #0f172a !important; border-right: 1px solid #1e293b; }
                      .fi-main-sidebar .fi-sidebar-header { background-color: #0f172a; border-bottom: 1px solid #1e293b; box-shadow: none; }
                      .fi-main-sidebar .fi-logo { color: #f8fafc; }
                      /* ナビ項目（通常） */
                      .fi-main-sidebar .fi-sidebar-item-btn { color: #cbd5e1; border-radius: 0.5rem; font-weight: 500; }
                      .fi-main-sidebar .fi-sidebar-item-icon { color: #94a3b8; }
                      /* ホバー */
                      .fi-main-sidebar .fi-sidebar-item-btn:hover { background-color: #1e293b; color: #ffffff; }
                      .fi-main-sidebar .fi-sidebar-item-btn:hover .fi-sidebar-item-icon { color: #e2e8f0; }
                      /* アクティブ（ブランドブルーのピル） */
                      .fi-main-sidebar .fi-sidebar-item.fi-active .fi-sidebar-item-btn,
                      .fi-main-sidebar .fi-sidebar-item-btn[aria-current="page"] { background-color: #2563eb; color: #ffffff; box-shadow: 0 1px 2px rgba(2,6,23,.4); }
                      .fi-main-sidebar .fi-sidebar-item.fi-active .fi-sidebar-item-icon,
                      .fi-main-sidebar .fi-sidebar-item-btn[aria-current="page"] .fi-sidebar-item-icon { color: #ffffff; }
                      /* グループ見出し */
                      .fi-main-sidebar .fi-sidebar-group-label { color: #64748b; }
                      /* フッター・各種アイコンボタン */
                      .fi-main-sidebar .fi-sidebar-footer { border-top: 1px solid #1e293b; }
                      .fi-main-sidebar .fi-icon-btn { color: #94a3b8; }
                      .fi-main-sidebar .fi-icon-btn:hover { color: #ffffff; background-color: #1e293b; }
                      .fi-main-sidebar .fi-dropdown-list { background-color: #ffffff; }

                      /* ===== メイン領域・トップバー ===== */
                      .fi-main-ctn { background-color: #f1f5f9; }
                      .fi-topbar > * { background-color: #ffffff; border-bottom: 1px solid #e2e8f0; box-shadow: none; }
                      .fi-header-heading { letter-spacing: -0.01em; }

                      /* ===== 統計カードの質感（浮き上がり） ===== */
                      .fi-wi-stats-overview-stat { border: 1px solid #e2e8f0; border-radius: 0.85rem; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: box-shadow .15s ease, transform .15s ease; }
                      .fi-wi-stats-overview-stat:hover { box-shadow: 0 8px 20px rgba(15,23,42,.08); transform: translateY(-2px); }

                      /* ===== ダッシュボードのカード登場（フェードのみ・transformは使わない） ===== */
                      /* transform を使うとチャートの初期サイズ測定と競合するため opacity のみ */
                      @keyframes fiFade { from { opacity: 0; } to { opacity: 1; } }
                      .fi-wi { animation: fiFade .5s ease both; }
                      .fi-wi-chart { transition: box-shadow .2s ease; }
                      .fi-wi-chart:hover { box-shadow: 0 10px 24px rgba(15,23,42,.08); }
                      @media (prefers-reduced-motion: reduce) { .fi-wi { animation: none; } }

                      /* ===== ダークモード ===== */
                      .dark .fi-main-ctn { background-color: #020617; }
                      .dark .fi-topbar > * { background-color: #0f172a; border-bottom-color: #1e293b; }
                      .dark .fi-wi-stats-overview-stat { border-color: #1e293b; }
                    </style>
                    HTML)
            )
            ->colors([
                'primary' => Color::Blue,
            ])
            ->navigationGroups([
                '業務管理',
                '運営・設定',
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
                \App\Filament\Widgets\JobStatusChart::class,
                \App\Filament\Widgets\RecentApplications::class,
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
