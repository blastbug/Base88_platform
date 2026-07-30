<?php

namespace App\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 公開URL（Dev Tunnel 等）を指定した場合、絶対URL（Filament の
        // リダイレクト・アセット・Livewire エンドポイント）をそのホストに固定する。
        // Next プロキシ経由だと元の Host が localhost に化けて Filament が
        // http://localhost を生成してしまうため、ここで明示的に上書きする。
        // 未設定時は通常どおりリクエストのホストを使用（本番・ローカル開発に無影響）。
        if ($publicUrl = config('app.tunnel_url')) {
            URL::forceRootUrl($publicUrl);
            if (str_starts_with($publicUrl, 'https://')) {
                URL::forceScheme('https');
            }
        }

        // 管理画面（Filament / web ガード）のログイン・ログアウトを
        // アクセス・活動ログ(log_name=access)に記録する。API(sanctum)側の
        // ログインは AuthController で記録するため、ここでは web のみ対象。
        Event::listen(Login::class, function (Login $event): void {
            if ($event->guard !== 'web') {
                return;
            }
            try {
                activity('access')->causedBy($event->user)
                    ->withProperties([
                        'type' => 'login',
                        'email' => $event->user->email ?? null,
                        'role' => $event->user->role ?? null,
                        'ip' => request()->ip(),
                        'ua' => substr((string) request()->userAgent(), 0, 255),
                        'panel' => 'admin',
                    ])
                    ->event('login')
                    ->log('管理画面にログイン');
            } catch (\Throwable $e) {
                report($e);
            }
        });

        Event::listen(Logout::class, function (Logout $event): void {
            if ($event->guard !== 'web' || ! $event->user) {
                return;
            }
            try {
                activity('access')->causedBy($event->user)
                    ->withProperties(['type' => 'logout', 'email' => $event->user->email ?? null, 'panel' => 'admin'])
                    ->event('logout')
                    ->log('管理画面からログアウト');
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }
}
