# Build APK Without Android Studio - Complete Guide

This guide shows you how to build Android APK files using only command-line tools, without needing Android Studio.

## Prerequisites

You need these tools installed:

1. **Java JDK** (version 11 or higher)
   - Download: https://adoptium.net/ or https://www.oracle.com/java/technologies/downloads/
   - Verify: `java -version`

2. **Android SDK Command Line Tools**
   - Download: https://developer.android.com/studio#command-tools
   - Extract to a folder (e.g., `C:\Android\sdk` or `~/Android/sdk`)

3. **Node.js and npm** (already installed for your React app)

4. **Gradle** (optional - can use Gradle Wrapper)

## Method 1: Using Gradle Command Line (Recommended)

### Step 1: Setup Android SDK Environment Variables

**Windows (PowerShell):**
```powershell
# Set environment variables (add to your profile for permanent)
$env:ANDROID_HOME = "C:\Android\sdk"
$env:ANDROID_SDK_ROOT = "C:\Android\sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools\bin"
```

**Windows (Command Prompt):**
```cmd
set ANDROID_HOME=C:\Android\sdk
set ANDROID_SDK_ROOT=C:\Android\sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin
```

**Linux/Mac:**
```bash
export ANDROID_HOME=$HOME/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools/bin

# Add to ~/.bashrc or ~/.zshrc for permanent
echo 'export ANDROID_HOME=$HOME/Android/sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
```

### Step 2: Install Required Android SDK Components

```bash
# Accept licenses and install required components
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Step 3: Setup Capacitor (if not done)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Build React app
npm run build

# Initialize Capacitor (if needed)
npx cap init "Anitha Stores" "com.anithastores.app"

# Add Android platform
npx cap add android

# Sync assets
npx cap sync
```

### Step 4: Create Keystore for Signing

**Windows:**
```cmd
cd android\app
keytool -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores
```

**Linux/Mac:**
```bash
cd android/app
keytool -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (can be same as keystore)
- Your name, organization, etc.

### Step 5: Configure Signing in build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('anitha-stores-key.jks')
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "your_password_here"
            keyAlias 'anitha-stores'
            keyPassword System.getenv("KEY_PASSWORD") ?: "your_password_here"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

**Better: Use environment variables (more secure):**

Create `android/gradle.properties`:
```properties
KEYSTORE_PASSWORD=your_keystore_password
KEY_PASSWORD=your_key_password
```

Then in `build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("gradle.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            storeFile file('anitha-stores-key.jks')
            storePassword keystoreProperties['KEYSTORE_PASSWORD']
            keyAlias 'anitha-stores'
            keyPassword keystoreProperties['KEY_PASSWORD']
        }
    }
}
```

**⚠️ Important:** Add `gradle.properties` to `.gitignore`!

### Step 6: Build APK Using Gradle

**Windows:**
```cmd
cd android
gradlew.bat assembleRelease
```

**Linux/Mac:**
```bash
cd android
./gradlew assembleRelease
```

**Output location:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### Step 7: Build Android App Bundle (AAB) - Recommended for Play Store

**Windows:**
```cmd
cd android
gradlew.bat bundleRelease
```

**Linux/Mac:**
```bash
cd android
./gradlew bundleRelease
```

**Output location:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Method 2: Complete Automated Build Script

Create a build script to automate everything:

### Windows Script: `build-apk.ps1`

```powershell
# Build APK Script for Windows
Write-Host "🚀 Building Android APK..." -ForegroundColor Cyan

# Build React app
Write-Host "📦 Building React app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}

# Sync Capacitor
Write-Host "🔄 Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync

# Build APK
Write-Host "🔨 Building APK..." -ForegroundColor Yellow
cd android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ APK built successfully!" -ForegroundColor Green
    Write-Host "📍 Location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
} else {
    Write-Host "❌ APK build failed!" -ForegroundColor Red
    exit 1
}
```

### Linux/Mac Script: `build-apk.sh`

```bash
#!/bin/bash

echo "🚀 Building Android APK..."

# Build React app
echo "📦 Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ React build failed!"
    exit 1
fi

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync

# Build APK
echo "🔨 Building APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK built successfully!"
    echo "📍 Location: android/app/build/outputs/apk/release/app-release.apk"
else
    echo "❌ APK build failed!"
    exit 1
fi
```

**Usage:**
```bash
# Windows
powershell -ExecutionPolicy Bypass -File build-apk.ps1

# Linux/Mac
bash build-apk.sh
```

## Method 3: Using GitHub Actions (CI/CD)

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Install dependencies
      run: npm install
    
    - name: Build React app
      run: npm run build
    
    - name: Install Capacitor
      run: npm install @capacitor/core @capacitor/cli @capacitor/android
    
    - name: Add Android platform
      run: npx cap add android
    
    - name: Sync Capacitor
      run: npx cap sync
    
    - name: Build APK
      working-directory: android
      run: ./gradlew assembleRelease
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Issue: "gradlew: command not found"

**Solution:**
- Make sure you're in the `android` directory
- Use `./gradlew` on Linux/Mac or `gradlew.bat` on Windows
- If gradlew doesn't exist, run: `npx cap add android` first

### Issue: "SDK location not found"

**Solution:**
Create `android/local.properties`:
```properties
sdk.dir=C:\\Android\\sdk
# or on Linux/Mac:
# sdk.dir=/home/username/Android/sdk
```

### Issue: "Keystore file not found"

**Solution:**
- Make sure keystore is in `android/app/` directory
- Check the path in `build.gradle` matches the actual location

### Issue: "Build tools not found"

**Solution:**
```bash
sdkmanager "build-tools;34.0.0"
```

### Issue: "License not accepted"

**Solution:**
```bash
sdkmanager --licenses
# Press 'y' to accept all licenses
```

## Quick Reference Commands

```bash
# 1. Build React app
npm run build

# 2. Sync Capacitor
npx cap sync

# 3. Build APK (Windows)
cd android && gradlew.bat assembleRelease

# 3. Build APK (Linux/Mac)
cd android && ./gradlew assembleRelease

# 4. Build AAB (for Play Store)
cd android && ./gradlew bundleRelease

# 5. Check APK location
# Windows: android\app\build\outputs\apk\release\app-release.apk
# Linux/Mac: android/app/build/outputs/apk/release/app-release.apk
```

## Complete Workflow Example

```bash
# 1. Update version (optional)
node update-version.js

# 2. Build React app
npm run build

# 3. Sync with Capacitor
npx cap sync

# 4. Build signed release APK
cd android
./gradlew assembleRelease

# 5. APK is ready at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Building Different Variants

### Debug APK (unsigned, for testing)
```bash
cd android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (signed, for distribution)
```bash
cd android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Release AAB (for Play Store)
```bash
cd android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

## Verifying Your APK

After building, verify the APK:

```bash
# Check APK info
aapt dump badging app-release.apk

# Or use jarsigner to verify signature
jarsigner -verify -verbose -certs app-release.apk
```

## Summary

✅ **No Android Studio needed!** You can build APK using:
1. Gradle command line (recommended)
2. Automated build scripts
3. CI/CD pipelines (GitHub Actions, etc.)

The key is having:
- Java JDK installed
- Android SDK command-line tools
- Proper signing configuration
- Gradle wrapper (included with Capacitor)

Your APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

