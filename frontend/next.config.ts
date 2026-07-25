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
    ];
  },
};

export default nextConfig;
