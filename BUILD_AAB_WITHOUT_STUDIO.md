# Build AAB File Without Android Studio

This guide shows you how to create an Android App Bundle (AAB) file for Google Play Store without using Android Studio.

## Prerequisites

1. **Java Development Kit (JDK)** - Version 11 or higher
   - Download from: https://adoptium.net/
   - Set `JAVA_HOME` environment variable

2. **Android SDK Command Line Tools**
   - Download from: https://developer.android.com/studio#command-tools
   - Extract to a folder (e.g., `C:\Android\sdk`)
   - Set `ANDROID_HOME` environment variable to this path
   - Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools\bin` to PATH

3. **Node.js and npm** (already installed)

## Step 1: Install Capacitor

```bash
npm install @capacitor/cli @capacitor/core @capacitor/android
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: Your app name
- **App ID**: com.yourcompany.appname (e.g., `com.anithastores.app`)
- **Web dir**: `build`

## Step 3: Add Android Platform

```bash
npm run build
npx cap add android
npx cap sync
```

## Step 4: Create Keystore for Signing

Create a keystore file to sign your app (required for Play Store):

**Option 1: Use the helper script (recommended)**
```powershell
.\create-keystore-simple.ps1
```
This will show you the exact command with the correct path to keytool.

**Option 2: Direct command**

If `keytool` is in your PATH:
```bash
keytool -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores
```

If `keytool` is NOT in your PATH (common on Windows), use the full path:
```powershell
# Find keytool first
Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

# Then use the full path (example):
& 'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe' -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores
```

You'll be prompted for:
- **Keystore password** (must be at least 6 characters - remember this!)
- **Key password** (can be same as keystore password)
- Your name, organization, city, state, country code

**Important**: Keep the `.jks` file and password safe! You'll need them for all future updates.

## Step 5: Configure Signing in build.gradle

Edit `android/app/build.gradle` and add signing configuration:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            storeFile file('../anitha-stores-key.jks')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'anitha-stores'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Security Note**: For production, use environment variables or a separate properties file instead of hardcoding passwords.

## Step 6: Update Version Information

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        ...
        versionCode 1        // Increment for each release (1, 2, 3, ...)
        versionName "1.0.0"  // User-visible version (1.0.0, 1.0.1, ...)
    }
}
```

## Step 7: Build the AAB File

From the project root directory:

**Windows (PowerShell):**
```powershell
cd android
.\gradlew.bat bundleRelease
```

**Linux/Mac:**
```bash
cd android
./gradlew bundleRelease
```

The AAB file will be created at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Step 8: Verify the AAB

You can verify your AAB file using `bundletool`:

1. Download bundletool: https://github.com/google/bundletool/releases
2. Generate APKs from AAB:
```bash
java -jar bundletool.jar build-apks --bundle=app-release.aab --output=app.apks --ks=anitha-stores-key.jks --ks-pass=pass:YOUR_PASSWORD --ks-key-alias=anitha-stores --key-pass=pass:YOUR_PASSWORD
```

## Step 9: Upload to Play Store

1. Go to Google Play Console: https://play.google.com/console
2. Create a new app or select existing app
3. Go to **Production** → **Create new release**
4. Upload the `app-release.aab` file
5. Fill in release notes
6. Submit for review

## Troubleshooting

### Error: "gradlew.bat is not recognized"
**Solution**: Use `.\gradlew.bat` (with `.\` prefix) in PowerShell, or `./gradlew` on Linux/Mac.

### Error: "JAVA_HOME not set"
**Solution**: 
```powershell
# Windows PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"
```

### Error: "ANDROID_HOME not set"
**Solution**:
```powershell
# Windows PowerShell
$env:ANDROID_HOME = "C:\Android\sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools\bin"
```

### Error: "SDK location not found"
**Solution**: Create `android/local.properties` file:
```properties
sdk.dir=C:\\Android\\sdk
```

### Build fails with signing errors
**Solution**: Double-check:
- Keystore file path is correct
- Passwords match what you entered
- Key alias matches

## Quick Reference Commands

```bash
# 1. Build web app
npm run build

# 2. Sync with Android
npx cap sync

# 3. Build AAB
cd android
.\gradlew.bat bundleRelease  # Windows
./gradlew bundleRelease       # Linux/Mac

# 4. Find AAB file
# Location: android/app/build/outputs/bundle/release/app-release.aab
```

## Version Management

For each new release:
1. Increment `versionCode` (must be higher than previous)
2. Update `versionName` (e.g., 1.0.0 → 1.0.1)
3. Build new AAB
4. Upload to Play Store

## Security Best Practices

1. **Never commit keystore file to Git**
   - Add `*.jks` to `.gitignore`
   - Store keystore securely (password manager, secure backup)

2. **Use environment variables for passwords**:
   ```gradle
   signingConfigs {
       release {
           storeFile file(project.findProperty("RELEASE_STORE_FILE") ?: "../anitha-stores-key.jks")
           storePassword project.findProperty("RELEASE_STORE_PASSWORD") ?: ""
           keyAlias project.findProperty("RELEASE_KEY_ALIAS") ?: ""
           keyPassword project.findProperty("RELEASE_KEY_PASSWORD") ?: ""
       }
   }
   ```

3. **Create `android/keystore.properties`** (add to `.gitignore`):
   ```properties
   RELEASE_STORE_FILE=../anitha-stores-key.jks
   RELEASE_STORE_PASSWORD=your_password
   RELEASE_KEY_ALIAS=anitha-stores
   RELEASE_KEY_PASSWORD=your_password
   ```

4. **Load in build.gradle**:
   ```gradle
   def keystorePropertiesFile = rootProject.file("keystore.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```

