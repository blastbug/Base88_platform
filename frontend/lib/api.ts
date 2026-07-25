/**
 * BASE88 API クライアント
 * Laravel API（Sanctum トークン認証）と通信するための薄いラッパー。
 *
 * ブラウザからは常にフロントと同一オリジンの "/api" を叩き、Next サーバが
 * バックエンド（Laravel）へプロキシします（next.config.ts の rewrites）。
 * これにより CORS 不要・単一ポートで、localhost でも VS Code Dev Tunnel
 * （別マシンからのアクセス）でも env の変更なしでそのまま動作します。
 */

const TOKEN_KEY = "base88_token";

/** API ベースパス（同一オリジン、Next がバックエンドへプロキシ） */
export function getApiBase(): string {
  return "/api";
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
  const base = getApiBase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined;
  let isUpload = false;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
      isUpload = true;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 応答が返らずに無限ローディングにならないよう、タイムアウトを設ける。
  // ファイルアップロード（FormData）は回線が遅い環境でも失敗しないよう長めにする。
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isUpload ? 120000 : 20000);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...options, headers, body, signal: controller.signal });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(0, { message: "サーバーに接続できませんでした（タイムアウト）。" }, "request timed out");
    }
    throw new ApiError(0, { message: "サーバーに接続できませんでした。" }, "network error");
  }
  clearTimeout(timer);

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, payload);
  }
  return payload as T;
}
