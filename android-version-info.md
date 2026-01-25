# Android Version Management Guide

## Understanding Android Versioning

Android apps use two version identifiers:

### 1. versionCode (Integer)
- **Purpose**: Internal version number used by Google Play Store
- **Rules**:
  - Must be an integer
  - Must increase with each release
  - Cannot be decreased
  - Play Store rejects uploads with lower versionCode than existing version
- **Example**: 1, 2, 3, 4, 5...

### 2. versionName (String)
- **Purpose**: User-visible version string
- **Format**: Usually follows semantic versioning (MAJOR.MINOR.PATCH)
- **Example**: "1.0.0", "1.0.1", "1.1.0", "2.0.0"

## Version Numbering Strategy

### Semantic Versioning (Recommended)

Format: **MAJOR.MINOR.PATCH**

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major updates
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, small improvements

### Example Version Progression

| Release Type | versionCode | versionName | Description |
|--------------|-------------|-------------|-------------|
| Initial | 1 | 1.0.0 | First release |
| Bug fix | 2 | 1.0.1 | Fixed login bug |
| Bug fix | 3 | 1.0.2 | Fixed image upload |
| Feature | 4 | 1.1.0 | Added product search |
| Bug fix | 5 | 1.1.1 | Fixed search results |
| Major | 6 | 2.0.0 | Complete redesign |
| Bug fix | 7 | 2.0.1 | Fixed navigation |

## How to Update Versions

### Method 1: Manual Update

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2        // Increment this
        versionName "1.0.1"  // Update this
    }
}
```

### Method 2: Using Update Script

```bash
# Increment patch version (1.0.0 → 1.0.1)
node update-version.js

# Increment minor version (1.0.0 → 1.1.0)
node update-version.js minor

# Increment major version (1.0.0 → 2.0.0)
node update-version.js major
```

## Version Code Rules for Play Store

### ✅ Allowed
- versionCode: 1 → 2 → 3 → 4 (increasing)
- versionCode: 5 → 10 (can skip numbers, but not recommended)
- versionCode: 100 → 101 (any positive integer)

### ❌ Not Allowed
- versionCode: 5 → 4 (decreasing)
- versionCode: 5 → 5 (same number)
- versionCode: negative numbers

## Best Practices

1. **Always increment versionCode** for each release
2. **Use semantic versioning** for versionName
3. **Keep versionCode and versionName in sync** (roughly)
4. **Document version changes** in release notes
5. **Test before incrementing** version

## Version in Different Files

### Android (build.gradle)
```gradle
versionCode 5
versionName "1.2.3"
```

### package.json (optional, for reference)
```json
{
  "version": "1.2.3"
}
```

### Play Store Console
- **Version code**: 5 (internal)
- **Release name**: "1.2.3" (user-visible)

## Release Checklist

Before each release:

- [ ] Update versionCode (increment by 1)
- [ ] Update versionName (semantic versioning)
- [ ] Update CHANGELOG.md with changes
- [ ] Build and test the app
- [ ] Create signed APK/AAB
- [ ] Upload to Play Console
- [ ] Add release notes
- [ ] Submit for review

## Common Mistakes

1. **Forgetting to increment versionCode** → Play Store rejects upload
2. **Using same versionCode twice** → Play Store rejects upload
3. **Decreasing versionCode** → Play Store rejects upload
4. **Not updating versionName** → Users see old version number
5. **Inconsistent versioning** → Confusion for users and developers

## Version History Template

Keep a record of all versions:

```
v1.0.0 (versionCode: 1) - 2024-01-15
- Initial release
- Basic features

v1.0.1 (versionCode: 2) - 2024-01-20
- Fixed login bug
- Improved performance

v1.1.0 (versionCode: 3) - 2024-02-01
- Added product search
- New UI improvements

v2.0.0 (versionCode: 4) - 2024-03-15
- Complete redesign
- New features
```

## Quick Reference

```bash
# Check current version
grep "versionCode\|versionName" android/app/build.gradle

# Update patch version
node update-version.js

# Update minor version
node update-version.js minor

# Update major version
node update-version.js major
```

