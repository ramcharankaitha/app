#!/bin/bash

# Build APK Script for Linux/Mac
# This script builds Android APK without Android Studio

BUILD_TYPE=${1:-release}  # release or debug
BUILD_BUNDLE=${2:-false}   # true to build AAB

echo "🚀 Building Android APK..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from project root."
    exit 1
fi

# Build React app
echo "📦 Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ React build failed!"
    exit 1
fi
echo "✅ React build successful!"
echo ""

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync
if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi
echo "✅ Capacitor sync successful!"
echo ""

# Check if android directory exists
if [ ! -d "android" ]; then
    echo "❌ Error: android directory not found. Run 'npx cap add android' first."
    exit 1
fi

# Build APK/AAB
echo "🔨 Building Android $BUILD_TYPE..."
cd android

if [ "$BUILD_BUNDLE" = "true" ]; then
    echo "   Building Android App Bundle (AAB)..."
    ./gradlew bundleRelease
    OUTPUT_PATH="app/build/outputs/bundle/release/app-release.aab"
    OUTPUT_TYPE="AAB"
else
    if [ "$BUILD_TYPE" = "release" ]; then
        echo "   Building Release APK..."
        ./gradlew assembleRelease
        OUTPUT_PATH="app/build/outputs/apk/release/app-release.apk"
    else
        echo "   Building Debug APK..."
        ./gradlew assembleDebug
        OUTPUT_PATH="app/build/outputs/apk/debug/app-debug.apk"
    fi
    OUTPUT_TYPE="APK"
fi

cd ..

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ $OUTPUT_TYPE built successfully!"
    echo ""
    echo "📍 Location: android/$OUTPUT_PATH"
    echo ""
    
    if [ -f "android/$OUTPUT_PATH" ]; then
        FILE_SIZE=$(du -h "android/$OUTPUT_PATH" | cut -f1)
        echo "📊 File size: $FILE_SIZE"
    fi
else
    echo ""
    echo "❌ Build failed! Check errors above."
    exit 1
fi

