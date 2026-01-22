# Android APK Conversion & Play Store Publishing Guide

## Overview

This guide explains how to convert your React web application into an Android APK and publish it to the Google Play Store with proper version management.

## Method 1: Using Capacitor (Recommended)

Capacitor is the modern, recommended way to convert React apps to native mobile apps.

### Step 1: Install Capacitor

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Install Capacitor in your project
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

### Step 2: Initialize Capacitor

```bash
# Initialize Capacitor (if not already done)
npx cap init

# When prompted, provide:
# - App name: Anitha Stores (or your app name)
# - App ID: com.anithastores.app (use reverse domain notation)
# - Web directory: build (for React apps)
```

### Step 3: Build Your React App

```bash
# Build the production version
npm run build
```

### Step 4: Add Android Platform

```bash
# Add Android platform
npx cap add android

# Sync your web assets to Android
npx cap sync
```

### Step 5: Configure Android App

#### 5.1. Update app.json or capacitor.config.json

Create or update `capacitor.config.json` in your project root:

```json
{
  "appId": "com.anithastores.app",
  "appName": "Anitha Stores",
  "webDir": "build",
  "bundledWebRuntime": false,
  "server": {
    "url": "https://your-api-domain.com",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true
  }
}
```

#### 5.2. Configure Version in Android

Navigate to: `android/app/build.gradle`

Find and update the version information:

```gradle
android {
    ...
    defaultConfig {
        applicationId "com.anithastores.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1          // Integer - increment for each release
        versionName "1.0.0"     // String - user-visible version
        ...
    }
}
```

**Version Explanation:**
- **versionCode**: Integer that must be incremented for each release to Play Store
  - Start with 1
  - Increment by 1 for each update (1, 2, 3, 4...)
  - Play Store uses this to determine which version is newer
  
- **versionName**: String shown to users (e.g., "1.0.0", "1.2.3")
  - Follow semantic versioning: MAJOR.MINOR.PATCH
  - Examples: "1.0.0", "1.0.1", "1.1.0", "2.0.0"

#### 5.3. Update App Name and Icon

**App Name**: `android/app/src/main/res/values/strings.xml`
```xml
<resources>
    <string name="app_name">Anitha Stores</string>
</resources>
```

**App Icon**: Replace icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Use Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/

### Step 6: Open in Android Studio

```bash
# Open Android project in Android Studio
npx cap open android
```

### Step 7: Build APK in Android Studio

1. **Open Android Studio** (after running `npx cap open android`)
2. **Wait for Gradle sync** to complete
3. **Build Menu** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. Wait for build to complete
5. **Locate APK**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 8: Generate Signed APK (For Play Store)

**Important**: Play Store requires a signed APK/AAB (Android App Bundle).

#### 8.1. Create Keystore

```bash
# Navigate to android/app directory
cd android/app

# Generate keystore (replace with your details)
keytool -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores

# You'll be prompted for:
# - Password (remember this!)
# - Name, Organization, etc.
```

#### 8.2. Configure Signing in build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('anitha-stores-key.jks')
            storePassword 'YOUR_STORE_PASSWORD'
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

**⚠️ Security Note**: Don't commit passwords to git! Use environment variables:

```gradle
// In android/gradle.properties (add to .gitignore)
KEYSTORE_PASSWORD=your_password
KEY_ALIAS_PASSWORD=your_password

// In build.gradle
signingConfigs {
    release {
        storeFile file('anitha-stores-key.jks')
        storePassword KEYSTORE_PASSWORD
        keyAlias 'anitha-stores'
        keyPassword KEY_ALIAS_PASSWORD
    }
}
```

#### 8.3. Build Release APK

**Option A: Using Android Studio**
1. **Build** → **Generate Signed Bundle / APK**
2. Select **APK** or **Android App Bundle** (AAB recommended)
3. Select your keystore
4. Enter passwords
5. Select **release** build variant
6. Click **Finish**

**Option B: Using Command Line**
```bash
cd android
./gradlew assembleRelease
# APK location: app/build/outputs/apk/release/app-release.apk
```

### Step 9: Update Version for Next Release

When you need to release an update:

1. **Update versionCode** (increment by 1):
   ```gradle
   versionCode 2  // Was 1, now 2
   ```

2. **Update versionName** (semantic versioning):
   ```gradle
   versionName "1.0.1"  // Patch update
   // or
   versionName "1.1.0"  // Minor update
   // or
   versionName "2.0.0"  // Major update
   ```

3. **Rebuild and sign** the APK/AAB

## Method 2: Using Cordova (Alternative)

If you prefer Cordova:

```bash
# Install Cordova
npm install -g cordova

# Create Cordova project
cordova create anitha-stores-mobile com.anithastores.app "Anitha Stores"

# Add Android platform
cd anitha-stores-mobile
cordova platform add android

# Copy your built React app
# Copy contents of build/ to www/

# Build APK
cordova build android --release
```

## Publishing to Google Play Store

### Step 1: Create Google Play Developer Account

1. Go to https://play.google.com/console
2. Pay one-time $25 registration fee
3. Complete account setup

### Step 2: Create New App

1. **Play Console** → **Create app**
2. Fill in:
   - **App name**: Anitha Stores
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free (or Paid)
   - **Declarations**: Accept terms

### Step 3: Prepare Store Listing

#### 3.1. App Details
- **App name**: Anitha Stores
- **Short description**: (80 characters max)
- **Full description**: (4000 characters max)
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: 
  - Phone: At least 2, up to 8 (16:9 or 9:16)
  - Tablet: Optional
  - TV: Optional

#### 3.2. Categorization
- **App category**: Business / Productivity / etc.
- **Content rating**: Complete questionnaire
- **Target audience**: Select appropriate

#### 3.3. Privacy Policy
- Required for apps that collect data
- Host on your website
- Add URL in Play Console

### Step 4: Upload APK/AAB

1. **Play Console** → **Your App** → **Production** (or **Internal testing**)
2. **Create new release**
3. **Upload** your signed APK or AAB file
4. **Release name**: Match your versionName (e.g., "1.0.0")
5. **Release notes**: Describe what's new in this version

### Step 5: Version Management in Play Console

When uploading updates:

1. **Version code** must be higher than previous
   - If last was 5, new must be 6 or higher
   - Play Store automatically rejects lower version codes

2. **Version name** can be any string
   - Users see this (e.g., "1.0.1", "2.0.0")
   - Doesn't need to increment sequentially

3. **Release tracks**:
   - **Internal testing**: Test with up to 100 testers
   - **Closed testing**: Test with specific groups
   - **Open testing**: Public beta
   - **Production**: Live on Play Store

### Step 6: Complete Store Listing

Fill in all required sections:
- ✅ Store listing
- ✅ Content rating
- ✅ Privacy policy
- ✅ App access (if applicable)
- ✅ Ads (if applicable)
- ✅ Data safety
- ✅ Target audience

### Step 7: Submit for Review

1. **Review** all information
2. **Submit for review**
3. Wait for approval (usually 1-3 days)
4. App goes live automatically after approval

## Version Management Best Practices

### Version Numbering Strategy

**Version Code (versionCode)**:
- Always increment by 1 for each release
- Never decrease
- Example progression: 1 → 2 → 3 → 4 → 5

**Version Name (versionName)**:
- Use semantic versioning: MAJOR.MINOR.PATCH
- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

### Example Version History

| Release | versionCode | versionName | Description |
|---------|-------------|-------------|-------------|
| Initial | 1 | 1.0.0 | First release |
| Bug fix | 2 | 1.0.1 | Fixed login issue |
| Feature | 3 | 1.1.0 | Added product search |
| Bug fix | 4 | 1.1.1 | Fixed image upload |
| Major | 5 | 2.0.0 | Complete UI redesign |

### Automated Version Management

Create a script to automate version updates:

**update-version.js**:
```javascript
const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(__dirname, 'android/app/build.gradle');
const packageJsonPath = path.join(__dirname, 'package.json');

// Read current versions
const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Extract current version
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
const versionNameMatch = buildGradle.match(/versionName\s+"([^"]+)"/);

let versionCode = parseInt(versionCodeMatch[1]) + 1;
const [major, minor, patch] = versionNameMatch[1].split('.').map(Number);

// Update version (increment patch by default)
const newVersionName = `${major}.${minor}.${patch + 1}`;

// Update build.gradle
const updatedGradle = buildGradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);

fs.writeFileSync(buildGradlePath, updatedGradle);

console.log(`✅ Updated version: ${newVersionName} (${versionCode})`);
```

Run before each release:
```bash
node update-version.js
```

## Troubleshooting

### Common Issues

1. **Build fails**: Check Android SDK is installed
2. **APK too large**: Enable ProGuard, use AAB instead of APK
3. **CORS errors**: Configure server URL in capacitor.config.json
4. **Version code error**: Ensure versionCode is higher than previous
5. **Signing error**: Verify keystore path and passwords

### Required Tools

- **Node.js** (v14+)
- **Java JDK** (v11+)
- **Android Studio** (latest)
- **Android SDK** (API 22+)

## Quick Reference Commands

```bash
# Build React app
npm run build

# Sync with Capacitor
npx cap sync

# Open in Android Studio
npx cap open android

# Build release APK (command line)
cd android && ./gradlew assembleRelease

# Check current version
grep "versionCode\|versionName" android/app/build.gradle
```

## Summary Checklist

- [ ] Install Capacitor
- [ ] Build React app (`npm run build`)
- [ ] Add Android platform (`npx cap add android`)
- [ ] Configure app ID and name
- [ ] Set versionCode and versionName
- [ ] Create keystore for signing
- [ ] Configure signing in build.gradle
- [ ] Build signed release APK/AAB
- [ ] Create Google Play Developer account
- [ ] Create app in Play Console
- [ ] Complete store listing
- [ ] Upload APK/AAB
- [ ] Submit for review
- [ ] Monitor and respond to review feedback

## Next Steps After Publishing

1. **Monitor reviews** and ratings
2. **Track crashes** in Play Console
3. **Update regularly** with bug fixes and features
4. **Increment versionCode** for each update
5. **Update versionName** following semantic versioning

---

**Note**: Keep your keystore file safe! You'll need it for all future updates. If lost, you cannot update your app on Play Store.

