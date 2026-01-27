# Create Keystore for Android App Signing (Simple Version)
# This script finds keytool and shows you the command to run

Write-Host "Creating Android App Keystore..." -ForegroundColor Green

# Try to find keytool
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
    exit 1
}

Write-Host ""
Write-Host "Found keytool at: $keytool" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run this command to create your keystore:" -ForegroundColor Yellow
Write-Host ""
Write-Host "& '$keytool' -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores" -ForegroundColor White
Write-Host ""
Write-Host "You will be prompted for:" -ForegroundColor Cyan
Write-Host "  - Keystore password (must be at least 6 characters)" -ForegroundColor Cyan
Write-Host "  - Key password (can be same as keystore password)" -ForegroundColor Cyan
Write-Host "  - Your name, organization, city, state, country code" -ForegroundColor Cyan
Write-Host ""





