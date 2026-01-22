#!/bin/bash

# Android APK Setup Script for Anitha Stores
# This script helps set up Capacitor and Android platform

echo "🚀 Setting up Android APK conversion for Anitha Stores..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install Capacitor dependencies
echo "📦 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# Build React app
echo ""
echo "🏗️  Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Initialize Capacitor (if not already initialized)
if [ ! -f "capacitor.config.json" ]; then
    echo "⚙️  Initializing Capacitor..."
    npx cap init "Anitha Stores" "com.anithastores.app"
else
    echo "✅ Capacitor already initialized"
fi

# Add Android platform
echo ""
echo "📱 Adding Android platform..."
npx cap add android

# Sync web assets
echo ""
echo "🔄 Syncing web assets to Android..."
npx cap sync

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Configure version in: android/app/build.gradle"
echo "3. Create keystore for signing"
echo "4. Build signed APK/AAB"
echo ""
echo "📖 See ANDROID_APK_GUIDE.md for detailed instructions"

