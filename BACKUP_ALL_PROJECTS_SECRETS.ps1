# ============================================================
# KABIR WORKSPACE — ALL PROJECTS SECRETS AUTO-BACKUP
# Automatically discovers and packages all .env and secret
# configs across all projects in kabir-workspace.
# ============================================================

$workspaceRoot = $PSScriptRoot
if (-not $workspaceRoot) { $workspaceRoot = (Get-Item ".").FullName }

$targetZip = Join-Path $workspaceRoot "KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip"
$tempDir = Join-Path $env:TEMP "kabir_secrets_$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$excludeFolders = @('node_modules', '.git', 'dist', 'build', 'release', 'vendor', '.gemini', 'brain', '.vscode', '.idea')

function Find-SecretFiles($dir) {
    $results = @()
    try {
        $files = [System.IO.Directory]::GetFiles($dir)
        foreach ($f in $files) {
            $name = [System.IO.Path]::GetFileName($f)
            # Match .env, .env.production, google_drive_credentials.json, token caches
            if (($name -like '.env*' -and $name -notlike '*.example') -or
                $name -like '*credentials*.json' -or
                $name -like '*token_cache*.json') {
                $results += $f
            }
        }
        $subDirs = [System.IO.Directory]::GetDirectories($dir)
        foreach ($d in $subDirs) {
            $dirName = [System.IO.Path]::GetFileName($d)
            if ($excludeFolders -notcontains $dirName) {
                $results += Find-SecretFiles $d
            }
        }
    } catch {}
    return $results
}

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " 📦 KABIR WORKSPACE: MASTER SECRETS AUTO-BACKUP" -ForegroundColor Cyan
Write-Host " Scanning all projects in: $workspaceRoot" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan

$secretFiles = Find-SecretFiles $workspaceRoot

if ($secretFiles.Count -eq 0) {
    Write-Host "No secret files found in workspace." -ForegroundColor Red
    Remove-Item -Recurse -Force $tempDir
    exit
}

$count = 0
foreach ($filePath in $secretFiles) {
    # Calculate relative path from kabir-workspace
    $relPath = $filePath.Substring($workspaceRoot.Length).TrimStart('\', '/')
    $destPath = Join-Path $tempDir $relPath
    $destFolder = Split-Path $destPath -Parent
    
    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    }
    
    Copy-Item $filePath -Destination $destPath -Force
    $project = $relPath.Split('\')[0]
    $sub = $relPath.Substring($project.Length).TrimStart('\')
    Write-Host " [+] [$project] $sub" -ForegroundColor Green
    $count++
}

# Create Zip
if (Test-Path $targetZip) { Remove-Item $targetZip -Force }
Compress-Archive -Path "$tempDir\*" -DestinationPath $targetZip -Force
Remove-Item -Recurse -Force $tempDir

$zipSizeKb = [Math]::Round((Get-Item $targetZip).Length / 1024, 2)

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " ✓ Master Backup Complete!" -ForegroundColor Green
Write-Host " Total Files Packaged: $count files" -ForegroundColor White
Write-Host " Archive Created: KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip ($zipSizeKb KB)" -ForegroundColor Yellow
Write-Host " Location: $targetZip" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "👉 What to do for New PC:" -ForegroundColor White
Write-Host " 1. Take 'KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip' via Pendrive/Drive/Telegram."
Write-Host " 2. On your new PC, clone your repos into your workspace folder."
Write-Host " 3. Place 'KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip' in the workspace root."
Write-Host " 4. Run 'RESTORE_ALL_PROJECTS_SECRETS.ps1' or right-click 'Extract Here'."
Write-Host " Instant magic: All .env files across ALL projects land in their exact spots!" -ForegroundColor Green
