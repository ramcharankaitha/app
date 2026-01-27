# Fix Gradle Download Timeout Issue
# This script provides multiple solutions for Gradle download problems

Write-Host "Fixing Gradle Download Timeout..." -ForegroundColor Green
Write-Host ""

# Solution 1: Increase timeout in gradle-wrapper.properties
Write-Host "[Solution 1] Increasing network timeout..." -ForegroundColor Yellow
$gradleWrapperProps = "android\gradle\wrapper\gradle-wrapper.properties"
if (Test-Path $gradleWrapperProps) {
    $content = Get-Content $gradleWrapperProps -Raw
    $content = $content -replace 'networkTimeout=\d+', 'networkTimeout=300000'
    Set-Content -Path $gradleWrapperProps -Value $content -NoNewline
    Write-Host "  Updated timeout to 300 seconds (5 minutes)" -ForegroundColor Green
} else {
    Write-Host "  Error: gradle-wrapper.properties not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[Solution 2] Manual Download Instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "If the download still fails, manually download Gradle:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Download from: https://services.gradle.org/distributions/gradle-8.14.3-all.zip" -ForegroundColor White
Write-Host "2. Extract to: $env:USERPROFILE\.gradle\wrapper\dists\gradle-8.14.3-all\[hash]\gradle-8.14.3-all" -ForegroundColor White
Write-Host ""
Write-Host "   OR place the zip file in:" -ForegroundColor White
Write-Host "   $env:USERPROFILE\.gradle\wrapper\dists\gradle-8.14.3-all\[hash]\gradle-8.14.3-all.zip" -ForegroundColor White
Write-Host ""
Write-Host "   The [hash] folder will be created automatically on first run." -ForegroundColor Yellow
Write-Host ""

# Solution 3: Check if Gradle is already downloaded
Write-Host "[Solution 3] Checking for existing Gradle installation..." -ForegroundColor Yellow
$gradleHome = "$env:USERPROFILE\.gradle\wrapper\dists"
if (Test-Path $gradleHome) {
    $existingGradle = Get-ChildItem -Path $gradleHome -Recurse -Filter "gradle-8.14.3-all.zip" -ErrorAction SilentlyContinue
    if ($existingGradle) {
        Write-Host "  Found existing Gradle download at: $($existingGradle.FullName)" -ForegroundColor Green
        Write-Host "  Try running the build again - it should use the existing download." -ForegroundColor Cyan
    } else {
        Write-Host "  No existing Gradle 8.14.3 found" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Gradle user home not found - will be created on first download" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[Solution 4] Alternative: Use Gradle Daemon with increased timeout" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can also set environment variables:" -ForegroundColor Cyan
Write-Host '  $env:GRADLE_OPTS = "-Dorg.gradle.daemon.idletimeout=300000"' -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Try building again: cd android; .\gradlew.bat bundleRelease" -ForegroundColor White
Write-Host "2. If it still times out, manually download Gradle (see Solution 2 above)" -ForegroundColor White
Write-Host "3. Check your internet connection and firewall settings" -ForegroundColor White
Write-Host ""




