
# ╔══════════════════════════════════════════╗
# ║  Music App — Dev Server Launcher         ║
# ║  Run this from C:\Music_Application      ║
# ╚══════════════════════════════════════════╝

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:PGPASSWORD = "postgres"
$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "🎵 Music App — Starting all dev servers..." -ForegroundColor Green
Write-Host ""

# ── 1. BACKEND ─────────────────────────────────────────────────────────────────
Write-Host "▶ Starting Backend API  (http://localhost:5000)" -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList @(
  "/k",
  "title Backend API && cd /d `"$ROOT\backend`" && set NODE_PATH=$ROOT\node_modules && set PGPASSWORD=postgres && node `"$ROOT\node_modules\.bin\ts-node-dev.cmd`" --transpile-only src/server.ts"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ── 2. FRONTEND WEB ────────────────────────────────────────────────────────────
Write-Host "▶ Starting Frontend Web (http://localhost:3000)" -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList @(
  "/k",
  "title Frontend Web && cd /d `"$ROOT\frontend-web`" && `"$ROOT\node_modules\.bin\next.cmd`" dev"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# ── 3. ADMIN PANEL ─────────────────────────────────────────────────────────────
Write-Host "▶ Starting Admin Panel  (http://localhost:3001)" -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList @(
  "/k",
  "title Admin Panel && cd /d `"$ROOT\admin`" && `"$ROOT\node_modules\.bin\vite.cmd`" --port 3001"
) -WindowStyle Normal

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  🌐 Frontend Web  →  http://localhost:3000" -ForegroundColor White
Write-Host "  🖥  Admin Panel  →  http://localhost:3001" -ForegroundColor White
Write-Host "  ⚙  Backend API  →  http://localhost:5000/api" -ForegroundColor White
Write-Host "  💓 Health Check →  http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "  Admin login: admin@musicapp.com / Admin@12345" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⏳ Waiting ~30s for servers to start, then opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Open browser
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"
