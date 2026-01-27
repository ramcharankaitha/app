# Fix Gradle Download Timeout

## Problem
Gradle wrapper is timing out when trying to download Gradle 8.14.3 from the internet. The default timeout is 10 seconds, which is too short for large downloads.

## Solution 1: Increased Timeout (Already Applied)

I've increased the network timeout from 10 seconds to 300 seconds (5 minutes) in `android/gradle/wrapper/gradle-wrapper.properties`.

**Try building again:**
```powershell
cd android
.\gradlew.bat bundleRelease
```

## Solution 2: Manual Download (If Solution 1 Fails)

If the download still times out, manually download and install Gradle:

### Step 1: Download Gradle
Download from: https://services.gradle.org/distributions/gradle-8.14.3-all.zip

### Step 2: Find the Hash Folder
When you run `.\gradlew.bat bundleRelease`, it will create a folder with a hash. Look for:
```
C:\Users\YOUR_USERNAME\.gradle\wrapper\dists\gradle-8.14.3-all\[RANDOM_HASH]\gradle-8.14.3-all.zip
```

### Step 3: Place the Downloaded File
1. Create the hash folder if it doesn't exist
2. Place the downloaded `gradle-8.14.3-all.zip` file in that folder
3. Run the build again - Gradle will extract and use it

### Alternative: Extract Manually
1. Extract the downloaded zip file
2. Place the extracted `gradle-8.14.3-all` folder in:
   ```
   C:\Users\YOUR_USERNAME\.gradle\wrapper\dists\gradle-8.14.3-all\[RANDOM_HASH]\gradle-8.14.3-all
   ```

## Solution 3: Use a Different Network

If you're behind a corporate firewall or proxy:
1. Try using a different network (mobile hotspot, etc.)
2. Configure proxy settings in `gradle.properties`:
   ```properties
   systemProp.http.proxyHost=proxy.example.com
   systemProp.http.proxyPort=8080
   systemProp.https.proxyHost=proxy.example.com
   systemProp.https.proxyPort=8080
   ```

## Solution 4: Check Internet Connection

1. Verify you can access: https://services.gradle.org/distributions/gradle-8.14.3-all.zip in your browser
2. Check if antivirus/firewall is blocking the download
3. Try downloading from a different location/network

## Quick Test

After applying the timeout fix, try:
```powershell
cd android
.\gradlew.bat --version
```

This will attempt to download Gradle with the new timeout settings.




