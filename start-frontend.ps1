# BASE88 フロントエンド起動スクリプト（Next.js）
# 使い方: PowerShell で  .\start-frontend.ps1
# 起動後: http://localhost:3000
$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path $PSScriptRoot "frontend")

# 初回のみ: .env.local が無ければ作成
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
}

# 初回のみ: 依存が無ければインストール
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "== Next.js: http://localhost:3000  (API: $env:NEXT_PUBLIC_API_URL) ==" -ForegroundColor Green
npm run dev
