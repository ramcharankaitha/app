# Find keytool and Create Keystore for Android App Signing
# This script searches for keytool and creates the keystore

Write-Host ""
Write-Host "=== Finding keytool for Android Keystore Creation ===" -ForegroundColor Green
Write-Host ""

# Try to find keytool in common locations
$keytoolPaths = @(
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jre\bin\keytool.exe",
    "C:\Program Files (x86)\Android\Android Studio\jbr\bin\keytool.exe",
    "$env:LOCALAPPDATA\Android\Android Studio\jbr\bin\keytool.exe",
    "$env:JAVA_HOME\bin\keytool.exe"
)

$keytool = $null

# Check specific paths
foreach ($path in $keytoolPaths) {
    if (Test-Path $path) {
        $keytool = $path
        break
    }
}

# Search in Program Files
if (-not $keytool) {
    Write-Host "Searching in Program Files..." -ForegroundColor Yellow
    $found = Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue -Depth 3 | Select-Object -First 1
    if ($found) {
        $keytool = $found.FullName
    }
}

# Search in Program Files (x86)
if (-not $keytool) {
    Write-Host "Searching in Program Files (x86)..." -ForegroundColor Yellow
    $found = Get-ChildItem -Path "C:\Program Files (x86)" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue -Depth 3 | Select-Object -First 1
    if ($found) {
        $keytool = $found.FullName
    }
}

# Try to find via java command
if (-not $keytool) {
    try {
        $javaCmd = Get-Command java -ErrorAction Stop
        $javaPath = $javaCmd.Source
        $javaDir = Split-Path $javaPath
        $keytoolPath = Join-Path $javaDir "keytool.exe"
        if (Test-Path $keytoolPath) {
            $keytool = $keytoolPath
        } else {
            $parentDir = Split-Path $javaDir
            $keytoolPath = Join-Path $parentDir "bin\keytool.exe"
            if (Test-Path $keytoolPath) {
                $keytool = $keytoolPath
            }
        }
    } catch {
        # Java not found in PATH
    }
}

if (-not $keytool) {
    Write-Host ""
    Write-Host "ERROR: keytool not found on your system!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install Java JDK (Recommended)" -ForegroundColor Cyan
    Write-Host "  Download from: https://adoptium.net/" -ForegroundColor White
    Write-Host "  Or: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor White
    Write-Host "  After installation, run this script again." -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Install Android Studio" -ForegroundColor Cyan
    Write-Host "  Android Studio includes JDK with keytool." -ForegroundColor White
    Write-Host "  Download from: https://developer.android.com/studio" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Found keytool at: $keytool" -ForegroundColor Green
Write-Host ""

# Check if keystore already exists
$keystoreFile = "anitha_stores_keystore.jks"
if (Test-Path $keystoreFile) {
    Write-Host "WARNING: $keystoreFile already exists!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "Cancelled. Keeping existing keystore." -ForegroundColor Yellow
        exit 0
    }
    Remove-Item $keystoreFile -Force
    Write-Host "Removed existing keystore." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Creating keystore: $keystoreFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "You will be prompted for the following information:" -ForegroundColor Yellow
Write-Host "  1. Keystore password (must be at least 6 characters - REMEMBER THIS!)" -ForegroundColor White
Write-Host "  2. Re-enter password" -ForegroundColor White
Write-Host "  3. Your first and last name" -ForegroundColor White
Write-Host "  4. Organizational unit" -ForegroundColor White
Write-Host "  5. Organization" -ForegroundColor White
Write-Host "  6. City or Locality" -ForegroundColor White
Write-Host "  7. State or Province" -ForegroundColor White
Write-Host "  8. Two-letter country code (e.g., IN or US)" -ForegroundColor White
Write-Host "  9. Confirm the information (yes)" -ForegroundColor White
Write-Host "  10. Key password (can be same as keystore password)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Save your keystore password securely!" -ForegroundColor Red
Write-Host "You will need it for all future app updates on Play Store." -ForegroundColor Red
Write-Host ""
Write-Host "Press Enter to start..." -ForegroundColor Yellow
Read-Host

# Create keystore
Write-Host ""
Write-Host "Running keytool command..." -ForegroundColor Cyan
Write-Host ""

& $keytool -genkey -v -keystore $keystoreFile -alias anitha -keyalg RSA -keysize 2048 -validity 10000

if ($LASTEXITCODE -eq 0 -and (Test-Path $keystoreFile)) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Keystore created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Keystore file: $keystoreFile" -ForegroundColor Cyan
    Write-Host "Alias: anitha" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Keep this keystore file safe (back it up!)" -ForegroundColor White
    Write-Host "2. Remember your keystore password" -ForegroundColor White
    Write-Host "3. Configure signing in android/app/build.gradle" -ForegroundColor White
    Write-Host "4. Build your AAB file" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create keystore!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}

