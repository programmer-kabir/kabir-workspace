# ============================================================
# KABIR WORKSPACE — ALL PROJECTS SECRETS AUTO-RESTORE
# Automatically extracts all .env files and secret credentials
# into every project folder across kabir-workspace.
# ============================================================

$workspaceRoot = $PSScriptRoot
if (-not $workspaceRoot) { $workspaceRoot = (Get-Item ".").FullName }

$targetZip = Join-Path $workspaceRoot "KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip"

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " 🔄 KABIR WORKSPACE: MASTER SECRETS AUTO-RESTORE" -ForegroundColor Cyan
Write-Host " Target Directory: $workspaceRoot" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan

if (-not (Test-Path $targetZip)) {
    Write-Host "`nError: '$targetZip' not found!" -ForegroundColor Red
    Write-Host "Please place 'KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip' in this workspace root folder and re-run." -ForegroundColor Yellow
    exit 1
}

try {
    Write-Host "`nRestoring all .env and secret files across all projects..." -ForegroundColor Yellow
    Expand-Archive -Path $targetZip -DestinationPath $workspaceRoot -Force
    Write-Host "`n=================================================" -ForegroundColor Cyan
    Write-Host " ✓ Master Restore Complete!" -ForegroundColor Green
    Write-Host " All .env files and private credentials have been restored to their exact project locations." -ForegroundColor White
    Write-Host " Every frontend and backend project is now fully configured and ready to run!" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
} catch {
    Write-Host "`nFailed to restore archive: $_" -ForegroundColor Red
    exit 1
}
