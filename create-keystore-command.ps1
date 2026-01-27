# Find keytool and show the command to create keystore
# Run the command manually in your terminal

Write-Host ""
Write-Host "=== Finding keytool ===" -ForegroundColor Green
Write-Host ""

$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"

if (-not (Test-Path $keytool)) {
    Write-Host "Searching for keytool..." -ForegroundColor Yellow
    $found = Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue -Depth 3 | Select-Object -First 1
    if ($found) {
        $keytool = $found.FullName
    } else {
        Write-Host "ERROR: keytool not found!" -ForegroundColor Red
        Write-Host "Please install Java JDK or Android Studio." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Found keytool at: $keytool" -ForegroundColor Green
Write-Host ""
Write-Host "=== Run this command in your terminal ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "& '$keytool' -genkey -v -keystore anitha_stores_keystore.jks -alias anitha -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
Write-Host ""
Write-Host "You will be prompted for:" -ForegroundColor Yellow
Write-Host "  - Keystore password (at least 6 characters - REMEMBER THIS!)" -ForegroundColor White
Write-Host "  - Re-enter password" -ForegroundColor White
Write-Host "  - Your name, organization, city, state, country code" -ForegroundColor White
Write-Host "  - Key password (can be same as keystore password)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Save your keystore password securely!" -ForegroundColor Red
Write-Host ""

