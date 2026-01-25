#!/usr/bin/env node

/**
 * Version Update Script for Android APK
 * Automatically increments versionCode and versionName
 * 
 * Usage: node update-version.js [major|minor|patch]
 * Default: patch (increments patch version)
 */

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const packageJsonPath = path.join(__dirname, 'package.json');

// Check if build.gradle exists
if (!fs.existsSync(buildGradlePath)) {
    console.error('❌ android/app/build.gradle not found!');
    console.error('   Make sure you have added the Android platform first.');
    process.exit(1);
}

// Read current versions
const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// Extract current version
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
const versionNameMatch = buildGradle.match(/versionName\s+"([^"]+)"/);

if (!versionCodeMatch || !versionNameMatch) {
    console.error('❌ Could not find versionCode or versionName in build.gradle');
    process.exit(1);
}

let versionCode = parseInt(versionCodeMatch[1]);
const currentVersionName = versionNameMatch[1];
const [major, minor, patch] = currentVersionName.split('.').map(Number);

// Determine version increment type
const incrementType = process.argv[2] || 'patch';
let newVersionName;

switch (incrementType) {
    case 'major':
        newVersionName = `${major + 1}.0.0`;
        break;
    case 'minor':
        newVersionName = `${major}.${minor + 1}.0`;
        break;
    case 'patch':
    default:
        newVersionName = `${major}.${minor}.${patch + 1}`;
        break;
}

// Increment version code
versionCode += 1;

// Update build.gradle
const updatedGradle = buildGradle
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);

fs.writeFileSync(buildGradlePath, updatedGradle);

// Also update package.json if it exists
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersionName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

console.log('');
console.log('✅ Version updated successfully!');
console.log('');
console.log(`   Previous: ${currentVersionName} (${versionCode - 1})`);
console.log(`   New:      ${newVersionName} (${versionCode})`);
console.log(`   Type:     ${incrementType}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Review changes in android/app/build.gradle');
console.log('   2. Build your app: npm run build');
console.log('   3. Sync with Capacitor: npx cap sync');
console.log('   4. Build signed APK/AAB in Android Studio');
console.log('');

