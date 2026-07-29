# =============================================================================
# BASE88 デモ用 高速起動スクリプト（Windows / php artisan serve）
#
# 目的:
#   php artisan serve は毎リクエストでアプリを起動し直すため遅い。
#   OPcache（オペコードキャッシュ）＋ 各種キャッシュ（config/route/view/
#   filament）を有効にして、開発サーバーでも可能な範囲で高速化する。
#
# 使い方:
#   PowerShell で backend ディレクトリから:  ./serve-fast.ps1
#
# 注意:
#   - route:cache / config:cache を使うため、コードや .env を変更したら
#     このスクリプトを再実行してください（キャッシュを作り直します）。
#   - 本番環境（nginx + php-fpm）ではワーカーが常駐するため、この対策は不要で、
#     さらに高速になります。
# =============================================================================

param(
  [int]$Port = 8000,
  [string]$BindHost = "127.0.0.1"
)

# --- PHP 実行ファイルの解決（PATH 優先、なければ winget の既定パス）---
$php = (Get-Command php -ErrorAction SilentlyContinue).Source
if (-not $php) {
  $php = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
}
if (-not (Test-Path $php)) { Write-Error "php.exe が見つかりません。`$php を修正してください。"; exit 1 }

$phpDir = Split-Path $php -Parent
$opcache = Join-Path $phpDir "ext\php_opcache.dll"

Set-Location $PSScriptRoot

# --- キャッシュ作成（高速化の主要因）---
Write-Host "== キャッシュを作成中 ==" -ForegroundColor Cyan
& $php artisan config:cache | Out-Null
& $php artisan event:cache  | Out-Null
& $php artisan route:cache  | Out-Null
& $php artisan view:cache   | Out-Null
& $php artisan filament:optimize | Out-Null
Write-Host "   done" -ForegroundColor Green

# --- 既存の :Port を停止 ---
$pids = (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
foreach ($p in $pids) { try { Stop-Process -Id $p -Force -ErrorAction Stop } catch {} }
Start-Sleep -Seconds 1

# --- OPcache を有効にして serve ---
$args = @()
if (Test-Path $opcache) {
  $args += @("-d","zend_extension=$opcache","-d","opcache.enable=1","-d","opcache.enable_cli=1",
             "-d","opcache.memory_consumption=256","-d","opcache.max_accelerated_files=50000",
             "-d","opcache.validate_timestamps=1","-d","opcache.revalidate_freq=10")
  Write-Host "== OPcache 有効で起動 ==" -ForegroundColor Cyan
} else {
  Write-Host "== OPcache DLL 無し。通常起動 ==" -ForegroundColor Yellow
}
$args += @("artisan","serve","--host=$BindHost","--port=$Port")

& $php @args
