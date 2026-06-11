# test-backend.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Script kiểm tra kết nối Google Apps Script
# Chạy: .\test-backend.ps1
# ─────────────────────────────────────────────────────────────────────────────

# ← THAY URL NÀY sau khi deploy Code.gs
$APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"

Write-Host ""
Write-Host "=== KIỂM TRA KẾT NỐI GOOGLE APPS SCRIPT ===" -ForegroundColor Yellow
Write-Host "URL: $APPS_SCRIPT_URL" -ForegroundColor Gray
Write-Host ""

function Test-API {
    param($Label, $Url)
    Write-Host "[$Label] " -NoNewline -ForegroundColor Cyan
    try {
        $res = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10
        if ($res.success) {
            Write-Host "✅ OK" -ForegroundColor Green
            Write-Host ($res | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        } else {
            Write-Host "⚠️  success=false: $($res.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ LỖI: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# 1. Ping
Test-API "PING" "$APPS_SCRIPT_URL`?action=ping"

# 2. Lấy kho HCM
Test-API "Stock HCM" "$APPS_SCRIPT_URL`?action=getStock&location=HCM"

# 3. Lấy kho HN
Test-API "Stock HN" "$APPS_SCRIPT_URL`?action=getStock&location=HN"

# 4. Check phone chưa tồn tại (expect: hasPlayed=false)
Test-API "checkPhone (new)" "$APPS_SCRIPT_URL`?action=checkPhone&phone=0900000000&location=HCM"

Write-Host "=== XONG ===" -ForegroundColor Yellow
Write-Host "Nhấn ENTER để đóng..."
Read-Host
