# BASE88 バックエンド起動スクリプト（Laravel API）
# 使い方: PowerShell で  .\start-backend.ps1
# 起動後: API http://localhost:8000/api  /  管理画面 http://localhost:8000/admin
$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path $PSScriptRoot "backend")

# 初回のみ: .env が無ければ作成し、アプリキーを生成
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    php artisan key:generate
}

# DB 準備（未実行なら migrate + seed。既存データを消したくない場合はこの行をコメントアウト）
php artisan migrate --force

Write-Host "== Laravel API: http://localhost:8000  (Admin: /admin) ==" -ForegroundColor Green
php artisan serve
