# Create Keystore for Android App Signing
# This script finds keytool and creates the keystore file

Write-Host "Creating Android App Keystore..." -ForegroundColor Green

# Try to find keytool in common locations
$keytoolPaths = @(
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "C:\Program Files (x86)\Java\jre1.8.0_471\bin\keytool.exe",
    "$env:JAVA_HOME\bin\keytool.exe"
)

$keytool = $null
foreach ($path in $keytoolPaths) {
    if (Test-Path $path) {
        $keytool = $path
        break
    }
}

# Also try to find via Get-Command
if (-not $keytool) {
    try {
        $javaCmd = Get-Command java -ErrorAction Stop
        $javaDir = Split-Path $javaCmd.Source
        $keytoolPath = Join-Path $javaDir "keytool.exe"
        if (Test-Path $keytoolPath) {
            $keytool = $keytoolPath
        }
    } catch {
        # Java not found in PATH
    }
}

# Search in Program Files
if (-not $keytool) {
    $found = Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $keytool = $found.FullName
    }
}

if (-not $keytool) {
    Write-Host ""
    Write-Host "Error: keytool not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Java JDK from: https://adoptium.net/" -ForegroundColor Yellow
    Write-Host "Or download Android Studio which includes JDK." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Found keytool at: $keytool" -ForegroundColor Cyan

# Check if keystore already exists
$keystoreFile = "anitha-stores-key.jks"
if (Test-Path $keystoreFile) {
    Write-Host ""
    Write-Host "Warning: $keystoreFile already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    Remove-Item $keystoreFile -Force
}

Write-Host ""
Write-Host "Creating keystore file: $keystoreFile" -ForegroundColor Yellow
Write-Host "You will be prompted for:" -ForegroundColor Cyan
Write-Host "  - Keystore password (remember this!)" -ForegroundColor Cyan
Write-Host "  - Key password (can be same as keystore password)" -ForegroundColor Cyan
Write-Host "  - Your name, organization, city, state, country code" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Yellow
Read-Host

# Create keystore
& $keytool -genkey -v -keystore $keystoreFile -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Keystore created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "File: $keystoreFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Keep this file and password safe!" -ForegroundColor Red
    Write-Host "You will need them for all future app updates." -ForegroundColor Red
    Write-Host ""
    Write-Host "Next step: Configure signing in android/app/build.gradle" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Error: Failed to create keystore!" -ForegroundColor Red
    exit 1
}
