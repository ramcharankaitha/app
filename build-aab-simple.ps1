# Build AAB File for Play Store (Windows PowerShell)
# This script builds the AAB file without Android Studio

Write-Host "Building AAB file for Play Store..." -ForegroundColor Green

# Step 1: Build React app
Write-Host "`n[1/3] Building React app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: React build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Sync Capacitor
Write-Host "`n[2/3] Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Build AAB
Write-Host "`n[3/3] Building AAB file..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat bundleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: AAB build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Success message
Write-Host ""
Write-Host "SUCCESS: AAB file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now upload this file to Google Play Console." -ForegroundColor Cyan

