/**
 * BASE88 API クライアント
 * Laravel API（Sanctum トークン認証）と通信するための薄いラッパー。
 *
 * API のベースURLは実行時に画面のURLから自動判定します：
 *  - localhost / 127.0.0.1（任意のフロントポート） → 同ホストの :8000
 *  - VS Code Dev Tunnel（例 xxxx-3000.<region>.devtunnels.ms）→ xxxx-8000.<region>.devtunnels.ms
 *  - それ以外（本番等） → NEXT_PUBLIC_API_URL（設定時）または 同ホストの :8000
 * これにより、ローカルでも Dev Tunnel 経由（別マシン）でも env の変更なしで動作します。
 */

const TOKEN_KEY = "base88_token";

/** 実行時に API ベースURL（末尾 /api）を解決する */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    // VS Code Dev Tunnel: "<id>-<port>.<region>.devtunnels.ms" のポート部を 8000 に差し替え
    const tunnel = hostname.match(/^(.*-)\d+(\..+\.devtunnels\.ms)$/i);
    if (tunnel) return `${protocol}//${tunnel[1]}8000${tunnel[2]}/api`;

    // ローカル開発（フロントのポートに関わらず）→ バックエンドは :8000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:8000/api`;
    }

    // その他のホスト（本番等）: env 優先、無ければ同ホストの :8000
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return `${protocol}//${hostname}:8000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * 認証トークンを自動付与して API を呼び出す。
 */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers, body });

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, payload);
  }
  return payload as T;
}
