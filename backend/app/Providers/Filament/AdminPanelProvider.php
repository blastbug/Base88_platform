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
            // サイドバー幅を加盟会社アプリと同じ 15rem に（既定 20rem は広すぎ）。
            ->sidebarWidth('15rem')
            // 管理画面のデザイン刷新（ブランド濃紺サイドバー・質感調整）。
            ->renderHook(
                PanelsRenderHook::HEAD_END,
                fn (): HtmlString => new HtmlString(<<<'HTML'
                    <style>
                      /* ===== ブランドサイドバー（加盟会社アプリと同色 nav-800=#1f2937） ===== */
                      .fi-main-sidebar { background-color: #1f2937 !important; border-right: 0; }
                      .fi-main-sidebar .fi-sidebar-header { background-color: #1f2937; box-shadow: none; }
                      .fi-main-sidebar .fi-logo { color: #ffffff; }
                      /* ナビ項目（通常）— 文字・アイコンをはっきり表示（ink-300 / ink-400 を明示指定） */
                      .fi-main-sidebar .fi-sidebar-item-btn { color: #cbd5e1; border-radius: 0.5rem; font-weight: 500; }
                      .fi-main-sidebar .fi-sidebar-item-label { color: #cbd5e1; }
                      .fi-main-sidebar .fi-sidebar-item-icon { color: #94a3b8; }
                      /* ホバー（アプリと同じ 白5%） */
                      .fi-main-sidebar .fi-sidebar-item-btn:hover { background-color: rgba(255,255,255,0.06); }
                      .fi-main-sidebar .fi-sidebar-item-btn:hover .fi-sidebar-item-label { color: #ffffff; }
                      .fi-main-sidebar .fi-sidebar-item-btn:hover .fi-sidebar-item-icon { color: #e2e8f0; }
                      /* アクティブ（brand-600 のピル・白文字） */
                      .fi-main-sidebar .fi-sidebar-item.fi-active .fi-sidebar-item-btn,
                      .fi-main-sidebar .fi-sidebar-item-btn[aria-current="page"] { background-color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
                      .fi-main-sidebar .fi-sidebar-item.fi-active .fi-sidebar-item-label,
                      .fi-main-sidebar .fi-sidebar-item-btn[aria-current="page"] .fi-sidebar-item-label,
                      .fi-main-sidebar .fi-sidebar-item.fi-active .fi-sidebar-item-icon,
                      .fi-main-sidebar .fi-sidebar-item-btn[aria-current="page"] .fi-sidebar-item-icon { color: #ffffff; }
                      /* グループ見出し（読める程度に） */
                      .fi-main-sidebar .fi-sidebar-group-label { color: #9ca3af; }
                      /* フッター・各種アイコンボタン */
                      .fi-main-sidebar .fi-sidebar-footer { border-top: 1px solid rgba(255,255,255,0.06); }
                      .fi-main-sidebar .fi-icon-btn { color: #9ca3af; }
                      .fi-main-sidebar .fi-icon-btn:hover { color: #ffffff; background-color: rgba(255,255,255,0.06); }
                      .fi-main-sidebar .fi-dropdown-list { background-color: #ffffff; }

                      /* ===== メイン領域 ===== */
                      .fi-main-ctn { background-color: #f1f5f9; }
                      .fi-header-heading { letter-spacing: -0.01em; }

                      /* ===== トップバー：白（コンテンツ上の独立した白いバー） =====
                         全幅のグレー境界線は使わず影のみで区切る（濃紺ブランド帯の下に
                         明るい線が出るのを防ぐ）。 */
                      .fi-topbar { background-color: #ffffff; box-shadow: 0 1px 3px rgba(15,23,42,.07); }
                      /* 左上ブランド領域を、サイドバー幅の濃紺ブロックにして"サイドバーの続き"にする（PCのみ） */
                      @media (min-width: 1024px) {
                        .fi-topbar-start {
                          align-self: stretch;
                          width: 15rem;                 /* = サイドバー幅（アプリと同じ 240px） */
                          margin-left: -1rem;           /* トップバー左パディング(16px)を打ち消し左端へ */
                          padding-left: 1.5rem;
                          display: flex;
                          align-items: center;
                          background-color: #1f2937;
                          border-right: 0;
                          border-bottom: 1px solid rgba(255,255,255,0.06); /* アプリと同じ控えめな線 */
                        }
                        .fi-topbar-start .fi-logo { color: #ffffff; }
                        /* グローバル検索をブランド帯の右隣（左寄り）へ移動 */
                        .fi-topbar { position: relative; }
                        .fi-topbar .fi-global-search-ctn {
                          position: absolute;
                          left: calc(15rem + 1.5rem);   /* ブランド帯(240px)の右＋余白 */
                          top: 50%;
                          transform: translateY(-50%);
                          width: 26rem;
                          max-width: calc(100% - 15rem - 12rem);
                          margin: 0;
                        }
                        .fi-topbar .fi-global-search { width: 100%; }
                      }
                      /* ナイトモード：サイドバー・ヘッダーを「元のナイトモード・ヘッダー色」(#0f172a)で統一 */
                      .dark .fi-main-sidebar { background-color: #0f172a !important; }
                      .dark .fi-main-sidebar .fi-sidebar-header { background-color: #0f172a; }
                      .dark .fi-topbar { background-color: #0f172a; box-shadow: none; }
                      .dark .fi-topbar-start { background-color: #0f172a; }

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
                      .dark .fi-wi-stats-overview-stat { border-color: #1e293b; }
                    </style>
                    HTML)
            )
            // Livewire の通信がタイムアウト等で失敗した際、既定の「黒いエラー
            // モーダル」を出さず、控えめな通知だけ表示して操作を継続可能にする。
            ->renderHook(
                PanelsRenderHook::BODY_END,
                fn (): HtmlString => new HtmlString(<<<'HTML'
                    <script>
                      document.addEventListener('livewire:init', function () {
                        if (!window.Livewire || typeof Livewire.hook !== 'function') return;
                        var TRANSIENT = [0, 408, 502, 503, 504, 429];
                        Livewire.hook('request', function (ctx) {
                          if (typeof ctx.fail !== 'function') return;
                          ctx.fail(function (info) {
                            var status = info && info.status;
                            if (TRANSIENT.indexOf(status) !== -1) {
                              if (typeof info.preventDefault === 'function') info.preventDefault();
                              window.__base88Toast && window.__base88Toast('通信が混み合っています。少し待って再度お試しください。');
                            }
                          });
                        });
                      });
                      window.__base88Toast = function (msg) {
                        try {
                          var id = 'base88-toast';
                          var el = document.getElementById(id);
                          if (el) el.remove();
                          el = document.createElement('div');
                          el.id = id;
                          el.textContent = msg;
                          el.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;'
                            + 'background:#111827;color:#fff;padding:12px 16px;border-radius:10px;'
                            + 'box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:14px;max-width:340px;'
                            + 'opacity:0;transition:opacity .25s ease;';
                          document.body.appendChild(el);
                          requestAnimationFrame(function () { el.style.opacity = '1'; });
                          setTimeout(function () {
                            el.style.opacity = '0';
                            setTimeout(function () { el.remove(); }, 300);
                          }, 4500);
                        } catch (e) {}
                      };
                    </script>
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
