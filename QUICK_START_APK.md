# Quick Start: Convert Web App to Android APK

## 🚀 Fast Track (5 Steps)

### Step 1: Setup Capacitor
```bash
# Run the setup script
bash setup-android.sh
# OR manually:
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap init "Anitha Stores" "com.anithastores.app"
npx cap add android
npx cap sync
```

### Step 2: Configure Version
Edit `android/app/build.gradle`:
```gradle
versionCode 1        // Start with 1, increment for each release
versionName "1.0.0"  // User-visible version
```

### Step 3: Build APK (Choose One Method)

**Option A: Command Line (No Android Studio needed!)**
```bash
# Windows
powershell -ExecutionPolicy Bypass -File build-apk.ps1

# Linux/Mac
bash build-apk.sh

# Or manually:
cd android
./gradlew assembleRelease  # Linux/Mac
gradlew.bat assembleRelease  # Windows
```

**Option B: Using Android Studio**
```bash
npx cap open android
# Then: Build → Generate Signed Bundle / APK
```

### Step 4: Create Keystore (First Time Only)
```bash
cd android/app
keytool -genkey -v -keystore anitha-stores-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anitha-stores
```
Then configure signing in `android/app/build.gradle` (see BUILD_APK_WITHOUT_STUDIO.md)

### Step 5: Upload to Play Store
1. Go to https://play.google.com/console
2. Create app → Upload AAB/APK
3. Complete store listing
4. Submit for review

## 📱 Version Management

### For Each Update:

1. **Update version**:
   ```bash
   node update-version.js        # Patch: 1.0.0 → 1.0.1
   node update-version.js minor  # Minor: 1.0.0 → 1.1.0
   node update-version.js major  # Major: 1.0.0 → 2.0.0
   ```

2. **Build and sync**:
   ```bash
   npm run build
   npx cap sync
   ```

3. **Build new APK/AAB**:
   ```bash
   # Command line (recommended)
   bash build-apk.sh
   # OR
   cd android && ./gradlew assembleRelease
   ```

4. **Upload to Play Store** (versionCode must be higher)

## 📋 Version Rules

- **versionCode**: Must increase (1, 2, 3, 4...)
- **versionName**: User-visible ("1.0.0", "1.0.1"...)
- **Play Store**: Rejects if versionCode is same or lower

## 🔑 Important Files

- `android/app/build.gradle` - Version configuration
- `capacitor.config.json` - App configuration
- `anitha-stores-key.jks` - Keystore (keep safe!)

## 📚 Full Documentation

- **Complete Guide**: `ANDROID_APK_GUIDE.md`
- **Build Without Studio**: `BUILD_APK_WITHOUT_STUDIO.md` ⭐
- **Version Info**: `android-version-info.md`

## ⚠️ Important Notes

1. **Keep keystore safe** - You'll need it for all updates
2. **Always increment versionCode** - Play Store requirement
3. **Test before publishing** - Use internal testing track first
4. **Update versionName** - Users see this version

## 🆘 Troubleshooting

- **Build fails?** → Check Android SDK is installed
- **Version error?** → Ensure versionCode is higher than previous
- **CORS issues?** → Configure server URL in capacitor.config.json

