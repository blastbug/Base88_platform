import type { NextConfig } from "next";

// バックエンド（Laravel）の所在。既定はローカルの php artisan serve。
// 本番やDocker等では BACKEND_ORIGIN 環境変数で上書きする。
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // ブラウザは常にフロントと同一オリジンの /api を叩き、Next サーバが
  // バックエンドへプロキシする。これにより CORS 不要・単一ポートで動作し、
  // localhost でも VS Code Dev Tunnel（別マシン）でもそのまま動く。
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
      // 添付ファイル（medialibrary の /storage）も同一オリジンで配信
      {
        source: "/storage/:path*",
        destination: `${BACKEND_ORIGIN}/storage/:path*`,
      },

      // --- Filament 管理画面（Laravel）も Next 経由で配信 ---
      // `php artisan serve` は PHP 組み込みの単一プロセスで並列処理できず、
      // Dev Tunnel 直結だと Filament の多数リクエスト（画面＋アセット＋
      // Livewire＋ウィジェット）が高レイテンシ下で詰まり 30 秒制限で落ちる。
      // Node(Next) がトンネル接続を並列に捌き、PHP へは高速なローカル
      // リクエストへ変換することで、管理画面もトンネル越しで安定動作する。
      // ※クライアントは 3000 のトンネル 1 本で /admin を開ける（8000 不要）。
      { source: "/admin", destination: `${BACKEND_ORIGIN}/admin` },
      { source: "/admin/:path*", destination: `${BACKEND_ORIGIN}/admin/:path*` },
      { source: "/filament/:path*", destination: `${BACKEND_ORIGIN}/filament/:path*` },
      // Livewire（既定 /livewire と、Filament が用いるハッシュ付きプレフィックス両対応）
      { source: "/livewire/:path*", destination: `${BACKEND_ORIGIN}/livewire/:path*` },
      { source: "/:lw(livewire-[A-Za-z0-9]+)/:path*", destination: `${BACKEND_ORIGIN}/:lw/:path*` },
      // Filament 公開アセット（CSS/JS/フォント）
      { source: "/css/filament/:path*", destination: `${BACKEND_ORIGIN}/css/filament/:path*` },
      { source: "/js/filament/:path*", destination: `${BACKEND_ORIGIN}/js/filament/:path*` },
      { source: "/fonts/filament/:path*", destination: `${BACKEND_ORIGIN}/fonts/filament/:path*` },
    ];
  },
};

export default nextConfig;
