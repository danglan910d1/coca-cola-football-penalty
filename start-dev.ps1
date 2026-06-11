# start-dev.ps1 - ASCII only (fix encoding issue)
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  COCA-COLA PENALTY SHOOTOUT - DEV MODE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "  GameApp  -> http://localhost:8081" -ForegroundColor Cyan
Write-Host "  UserApp  -> http://localhost:8083" -ForegroundColor Green
Write-Host "  AdminApp -> http://localhost:8085" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Close this window to stop all servers." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$ROOT\GameApp'; Write-Host '[GameApp] port 8081...' -ForegroundColor Cyan; npx expo start --clear --port 8081"

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$ROOT\UserApp'; Write-Host '[UserApp] port 8083...' -ForegroundColor Green; npx expo start --clear --port 8083"

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$ROOT\AdminApp'; node sync-env.js; Write-Host '[AdminApp] port 8085...' -ForegroundColor Yellow; npx -y serve -l 8085"

Write-Host "3 terminals opened." -ForegroundColor Green
Write-Host ""
Write-Host "Press ENTER to close..."
Read-Host
