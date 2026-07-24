# BASE88 — 引越案件共有プラットフォーム

引越会社同士が案件を掲載・応募し、成約後に顧客情報を開示できる会員制マッチングプラットフォーム（初期版 / MVP）。

- 仕様: 別紙「BASE88 初期版 要件定義書 Ver1.0」
- 構成: **Laravel（API）+ Next.js（フロントエンド）+ PostgreSQL**

---

## リポジトリ構成

```
base88-platform/
├── backend/            Laravel API（管理画面は Filament）
├── frontend/           Next.js（加盟会社向け画面 / レスポンシブ）
├── docker-compose.yml  PostgreSQL + Mailpit（メール検証）
└── README.md
```

## 主な採用技術・パッケージ

| 領域 | 採用 |
|---|---|
| API | Laravel 13 / PHP 8.3 |
| 認証 | Laravel Sanctum（トークン認証） |
| 権限 | spatie/laravel-permission（platform_admin / company_admin / staff） |
| 操作ログ | spatie/laravel-activitylog |
| 添付（画像・PDF） | spatie/laravel-medialibrary |
| 管理画面 | Filament v5 |
| フロント | Next.js 16 / React 19 / TypeScript / Tailwind CSS |
| DB | PostgreSQL 16（開発は SQLite でも即動作） |

---

## セットアップ

### 前提
- PHP 8.3（拡張: openssl, pdo_pgsql, mbstring, fileinfo, curl, zip, gd, exif, intl）
- Composer 2.x
- Node.js 20+ / npm
- （任意）Docker Desktop … PostgreSQL・Mailpit を使う場合

### 1. バックエンド（Laravel API）

```bash
cd backend
cp .env.example .env         # 初回のみ
php artisan key:generate     # 初回のみ（未設定の場合）

# DB を用意して migrate + seed
php artisan migrate:fresh --seed

# 開発サーバ起動（http://localhost:8000）
php artisan serve
```

- **手早く動かす**: `.env` は既定で `DB_CONNECTION=sqlite`。Docker 不要でそのまま動きます。
- **標準構成（PostgreSQL）**: `docker compose up -d` で DB を起動し、`.env` の PostgreSQL 行を有効化してください（`docker-compose.yml` と認証情報一致）。

初期アカウント（seeder 投入）:

| 区分 | メール | パスワード |
|---|---|---|
| BASE88管理者 | `admin@base88.local` | `password` |
| （サンプル）会社管理者 | `company@base88.local` | `password` |

> ⚠️ 上記は開発用の初期値です。本番では必ず変更してください。

管理画面（Filament）: `http://localhost:8000/admin`（platform_admin のみアクセス可）

### 2. フロントエンド（Next.js）

```bash
cd frontend
cp .env.local.example .env.local   # 初回のみ
npm install                        # 初回のみ（scaffold 済みなら不要）
npm run dev                        # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` に Laravel API のURL（既定 `http://localhost:8000/api`）を設定します。

### 3. （任意）開発インフラ

```bash
docker compose up -d
# PostgreSQL : localhost:5432
# Mailpit UI : http://localhost:8025 （送信メールの確認）
```

---

## データモデル概要

| テーブル | 内容 |
|---|---|
| `companies` | 加盟会社（status: pending/approved/suspended） |
| `users` | 担当者（role, company_id, is_active） |
| `moving_jobs` | 引越案件（status: recruiting/closed/contracted/completed/cancelled）※Laravel予約 `jobs` と衝突回避 |
| `moving_job_customer_details` | 顧客情報（**成約後のみ開示**・案件本体と分離） |
| `job_applications` | 応募（(job,company) 一意で二重応募防止） |
| `job_contracts` | 成約（1案件1成約） |
| `media` | 添付ファイル（medialibrary / 画像・PDF） |
| `activity_log` | 操作ログ |
| `notifications` | 通知 |

## セキュリティ設計の要点

- **顧客個人情報**は `moving_job_customer_details` に分離し、公開一覧・検索には一切含めない。
  開示は「成約済み」かつ「成約会社」のときのみ、API層の Policy で許可する（フロント側の非表示に依存しない）。
- 会社単位のデータ分離（自社案件・自社応募・公開案件のみ閲覧可）。
- 二重応募防止（DB一意制約）／自社案件応募禁止（アプリ層）／締切後の自動募集終了（スケジューラ）。

---

## 開発状況（このコミット時点）

- [x] 開発環境構築（PHP/Composer/Laravel/Next.js）
- [x] データモデル（マイグレーション）・Eloquentモデル
- [x] ロール/権限・初期管理者 seeder（SQLite で migrate/seed 検証済み）
- [x] Filament 管理パネル雛形（platform_admin 制限）
- [x] フロント API クライアント雛形
- [ ] 認証API（ログイン/ログアウト/パスワード再設定）
- [ ] 案件 CRUD・検索・応募・成約 API + Policy
- [ ] Filament 管理画面（会社承認・案件/応募/成約管理・操作ログ）
- [ ] フロント各画面（要件定義書 §9）
- [ ] メール通知・締切自動終了バッチ

> ※ 本コミットは「環境構築」フェーズの成果物です。以降の実装は要件定義書 §5 の範囲に沿って進めます。
