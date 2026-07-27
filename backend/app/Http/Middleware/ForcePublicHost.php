<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePublicHost
{
    /**
     * TUNNEL_URL が設定されている場合、リクエストを公開URL（Dev Tunnel 等）の
     * ホスト・スキームから来たものとして扱う。
     *
     * Next プロキシは元の Host を localhost に化けさせるため、これを補正しないと
     * $request->fullUrl() 由来の値（ログイン後の redirect()->intended() など）が
     * http(s)://localhost になり、別端末から到達できなくなる。ここで
     * X-Forwarded-* / Host を公開URLへ上書きすることで、Filament の絶対URL・
     * リダイレクトがすべて公開URLで一貫する。未設定時は何もしない（本番無影響）。
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tunnel = config('app.tunnel_url');

        if ($tunnel) {
            $u = parse_url($tunnel);

            if (! empty($u['host'])) {
                $scheme = $u['scheme'] ?? 'http';
                $port = $u['port'] ?? ($scheme === 'https' ? 443 : 80);
                $host = $u['host'] . (isset($u['port']) ? ':' . $u['port'] : '');

                // trustProxies(*) 有効下では getHost()/getScheme() は
                // X-Forwarded-* を優先するため、そこも公開URLへ揃える。
                $request->headers->set('X-Forwarded-Host', $host);
                $request->headers->set('X-Forwarded-Proto', $scheme);
                $request->headers->set('X-Forwarded-Port', (string) $port);
                $request->headers->set('HOST', $host);

                if ($scheme === 'https') {
                    $request->server->set('HTTPS', 'on');
                }
            }
        }

        return $next($request);
    }
}
