#!/bin/bash
# Build AAB File for Play Store (Linux/Mac)
# This script builds the AAB file without Android Studio

echo "Building AAB file for Play Store..."

# Step 1: Build React app
echo -e "\n[1/3] Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: React build failed!"
    exit 1
fi

# Step 2: Sync Capacitor
echo -e "\n[2/3] Syncing Capacitor..."
npx cap sync
if [ $? -ne 0 ]; then
    echo "Error: Capacitor sync failed!"
    exit 1
fi

# Step 3: Build AAB
echo -e "\n[3/3] Building AAB file..."
cd android
./gradlew bundleRelease
if [ $? -ne 0 ]; then
    echo "Error: AAB build failed!"
    cd ..
    exit 1
fi

cd ..

# Success message
echo -e "\n✓ AAB file created successfully!"
echo -e "\nLocation: android/app/build/outputs/bundle/release/app-release.aab"
echo -e "\nYou can now upload this file to Google Play Console."




