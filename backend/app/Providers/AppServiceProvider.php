<?php

namespace App\Providers;

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
    }
}
