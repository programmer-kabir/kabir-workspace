# ============================================================
# Creative Computer Academy — Secrets Backup Script
# Automatically packages all .env files and private credentials
# into a single ZIP archive for safe transfer to a new PC.
# ============================================================

$targetZip = "cca-env-secrets-backup.zip"
$tempDir = Join-Path $env:TEMP "cca_secrets_$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$filesToBackup = @(
    "admin-frontend\.env",
    "staff-frontend\.env",
    "review-frontend\.env",
    "student-frontend\.env",
    "Staff_Apps\Attendance-Desktop\.env",
    "server\.env",
    "server\config\google_drive_credentials.json",
    "server\config\google_drive_token_cache.json"
)

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " 📦 CCA Environment & Secrets Auto-Backup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$count = 0
foreach ($f in $filesToBackup) {
    if (Test-Path $f) {
        $dest = Join-Path $tempDir $f
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item $f -Destination $dest -Force
        Write-Host " [+] Backed up: $f" -ForegroundColor Green
        $count++
    } else {
        Write-Host " [-] Not found (skipped): $f" -ForegroundColor Yellow
    }
}

if ($count -eq 0) {
    Write-Host "`nNo secret files found to backup." -ForegroundColor Red
    Remove-Item -Recurse -Force $tempDir
    exit
}

if (Test-Path $targetZip) { Remove-Item $targetZip -Force }
Compress-Archive -Path "$tempDir\*" -DestinationPath $targetZip -Force
Remove-Item -Recurse -Force $tempDir

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " ✓ Backup Complete! ($count files packaged)" -ForegroundColor Green
Write-Host " Archive Created: $targetZip" -ForegroundColor Yellow
Write-Host " Full Path: $((Get-Item $targetZip).FullName)" -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "👉 How to use on New PC:" -ForegroundColor White
Write-Host " 1. Send '$targetZip' to yourself via Google Drive, Pendrive, or Telegram."
Write-Host " 2. Clone the Git repo on the new PC."
Write-Host " 3. Put '$targetZip' in the root project folder."
Write-Host " 4. Run '.\restore-secrets.ps1' or right-click 'Extract Here'."
Write-Host " That's it! All 6 .env files will drop into their exact subfolders automatically." -ForegroundColor Green
