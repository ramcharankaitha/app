# Fix Incomplete Android Project
# This script removes and re-initializes the Android platform

Write-Host "Fixing Android Project..." -ForegroundColor Green
Write-Host ""

# Step 1: Backup keystore if it exists
if (Test-Path "anitha-stores-key.jks") {
    $backupName = "anitha-stores-key.jks.backup"
    if (-not (Test-Path $backupName)) {
        Copy-Item "anitha-stores-key.jks" $backupName
        Write-Host "[1/4] Keystore backed up to $backupName" -ForegroundColor Green
    } else {
        Write-Host "[1/4] Keystore backup already exists" -ForegroundColor Yellow
    }
} else {
    Write-Host "[1/4] No keystore found to backup" -ForegroundColor Yellow
}

# Step 2: Build React app
Write-Host ""
Write-Host "[2/4] Building React app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: React build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Remove incomplete Android project
Write-Host ""
Write-Host "[3/4] Removing incomplete Android project..." -ForegroundColor Yellow
if (Test-Path "android") {
    Remove-Item -Recurse -Force android
    Write-Host "Android directory removed" -ForegroundColor Green
} else {
    Write-Host "Android directory not found" -ForegroundColor Yellow
}

# Step 4: Re-add Android platform
Write-Host ""
Write-Host "[4/4] Re-adding Android platform..." -ForegroundColor Yellow
npx cap add android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to add Android platform!" -ForegroundColor Red
    exit 1
}

# Sync Capacitor
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to sync Capacitor!" -ForegroundColor Red
    exit 1
}

# Verify critical files exist
Write-Host ""
Write-Host "Verifying project structure..." -ForegroundColor Yellow
$requiredFiles = @(
    "android\build.gradle",
    "android\settings.gradle",
    "android\app\build.gradle",
    "android\gradlew.bat"
)

$allExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $file" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host ""
    Write-Host "SUCCESS: Android project re-initialized!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Configure signing in android/app/build.gradle (if you have a keystore)" -ForegroundColor White
    Write-Host "2. Update version in android/app/build.gradle" -ForegroundColor White
    Write-Host "3. Build AAB: cd android; .\gradlew.bat bundleRelease" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "WARNING: Some required files are missing!" -ForegroundColor Red
    Write-Host "Try running: npx cap sync" -ForegroundColor Yellow
}

