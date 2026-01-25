# Build APK Script for Windows PowerShell
# This script builds Android APK without Android Studio

param(
    [string]$BuildType = "release",  # release or debug
    [switch]$Bundle = $false          # Build AAB instead of APK
)

Write-Host "🚀 Building Android APK..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from project root." -ForegroundColor Red
    exit 1
}

# Build React app
Write-Host "📦 Building React app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ React build successful!" -ForegroundColor Green
Write-Host ""

# Sync Capacitor
Write-Host "🔄 Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Capacitor sync successful!" -ForegroundColor Green
Write-Host ""

# Check if android directory exists
if (-not (Test-Path "android")) {
    Write-Host "❌ Error: android directory not found. Run 'npx cap add android' first." -ForegroundColor Red
    exit 1
}

# Build APK/AAB
Write-Host "🔨 Building Android $BuildType..." -ForegroundColor Yellow
Push-Location android

if ($Bundle) {
    Write-Host "   Building Android App Bundle (AAB)..." -ForegroundColor Cyan
    .\gradlew.bat bundleRelease
    $outputPath = "app\build\outputs\bundle\release\app-release.aab"
    $outputType = "AAB"
} else {
    if ($BuildType -eq "release") {
        Write-Host "   Building Release APK..." -ForegroundColor Cyan
        .\gradlew.bat assembleRelease
        $outputPath = "app\build\outputs\apk\release\app-release.apk"
    } else {
        Write-Host "   Building Debug APK..." -ForegroundColor Cyan
        .\gradlew.bat assembleDebug
        $outputPath = "app\build\outputs\apk\debug\app-debug.apk"
    }
    $outputType = "APK"
}

Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ $outputType built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Location: android\$outputPath" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path "android\$outputPath") {
        $fileInfo = Get-Item "android\$outputPath"
        $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Host "📊 File size: $fileSize MB" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Build failed! Check errors above." -ForegroundColor Red
    exit 1
}

