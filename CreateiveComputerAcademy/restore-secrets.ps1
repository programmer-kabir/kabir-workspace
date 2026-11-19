# ============================================================
# Creative Computer Academy — Secrets Restore Script
# Automatically restores all .env and private credential files
# from cca-env-secrets-backup.zip to their exact subfolders.
# ============================================================

$targetZip = "cca-env-secrets-backup.zip"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " 🔄 CCA Environment & Secrets Auto-Restore" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if (-not (Test-Path $targetZip)) {
    Write-Host "`nError: '$targetZip' not found in current folder!" -ForegroundColor Red
    Write-Host "Please place '$targetZip' in this root project directory and re-run this script." -ForegroundColor Yellow
    exit 1
}

try {
    Expand-Archive -Path $targetZip -DestinationPath . -Force
    Write-Host "`n✓ All .env files and private credentials successfully restored!" -ForegroundColor Green
    Write-Host "All frontend, backend, and desktop app environments are now ready to run." -ForegroundColor Cyan
} catch {
    Write-Host "`nFailed to extract archive: $_" -ForegroundColor Red
    exit 1
}
