# Android APK Setup Script for Anitha Stores (Windows PowerShell)
# This script helps set up Capacitor and Android platform

Write-Host "🚀 Setting up Android APK conversion for Anitha Stores..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install Capacitor dependencies
Write-Host "📦 Installing Capacitor dependencies..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli @capacitor/android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Capacitor dependencies." -ForegroundColor Red
    exit 1
}

# Build React app
Write-Host ""
Write-Host "🏗️  Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Initialize Capacitor (if not already initialized)
if (-not (Test-Path "capacitor.config.json")) {
    Write-Host "⚙️  Initializing Capacitor..." -ForegroundColor Yellow
    npx cap init "Anitha Stores" "com.anithastores.app"
} else {
    Write-Host "✅ Capacitor already initialized" -ForegroundColor Green
}

# Add Android platform
Write-Host ""
Write-Host "📱 Adding Android platform..." -ForegroundColor Yellow
npx cap add android

# Sync web assets
Write-Host ""
Write-Host "🔄 Syncing web assets to Android..." -ForegroundColor Yellow
npx cap sync

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Android Studio: npx cap open android"
Write-Host "2. Configure version in: android/app/build.gradle"
Write-Host "3. Create keystore for signing"
Write-Host "4. Build signed APK/AAB"
Write-Host ""
Write-Host "📖 See ANDROID_APK_GUIDE.md for detailed instructions" -ForegroundColor Yellow

