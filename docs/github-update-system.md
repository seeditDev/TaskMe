# GitHub Releases Auto-Update System for TaskMe

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub        │────▶│   GitHub API     │────▶│   React Native  │
│   Releases      │     │   (Latest)       │     │   App           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                          ┌──────────────────┐
│   QR Code       │                          │   Update Dialog  │
│   (Download     │                          │   Download       │
│   Link)         │                          │   Install        │
└─────────────────┘                          └──────────────────┘
```

## GitHub Repository Setup

### Repository: https://github.com/seeditDev/TaskMe

### Release Structure:
```
Release: v1.0.2 (tag: v1.0.2)
├── app-release.apk (APK file)
├── changelog.md (Release notes)
└── version.json (Metadata)
```

### version.json format:
```json
{
  "versionName": "1.0.2",
  "versionCode": 3,
  "apkUrl": "https://github.com/seeditDev/TaskMe/releases/download/v1.0.2/app-release.apk",
  "changelog": "Bug fixes and performance improvements",
  "forceUpdate": false,
  "minVersionCode": 1
}
```

## API Endpoints

### Get Latest Release Info:
```
GET https://api.github.com/repos/seeditDev/TaskMe/releases/latest
```

### Headers:
```
Accept: application/vnd.github.v3+json
User-Agent: TaskMe-App
```

### Sample Response:
```json
{
  "tag_name": "v1.0.2",
  "name": "Version 1.0.2",
  "body": "## Changelog\n- Fixed notification sync\n- Added history feature\n- Improved UI",
  "published_at": "2025-04-25T10:00:00Z",
  "assets": [
    {
      "name": "app-release.apk",
      "browser_download_url": "https://github.com/seeditDev/TaskMe/releases/download/v1.0.2/app-release.apk",
      "size": 15456789
    }
  ]
}
```

## QR Code Distribution

### Download Page URL:
```
https://seedit.site/taskme/download
```

### QR Code Points To:
```
https://github.com/seeditDev/TaskMe/releases/latest
```

### Generated QR Code (Mock):
```
┌─────────────────┐
│ ██████████████ │
│ ██          ██ │
│ ██  ██████  ██ │
│ ██  ██  ██  ██ │
│ ██  ██████  ██ │
│ ██          ██ │
│ ██████████████ │
└─────────────────┘
Scan to download TaskMe
```

## React Native Implementation

### For Expo Managed Workflow:
- Limited to OTA updates via `expo-updates`
- Cannot download and install APK directly
- Use `expo-updates` for JS bundle updates
- Use EAS Build for new APK releases

### For Bare Workflow (Ejected):
- Full control over APK download/install
- Requires native module implementation
- Can implement custom update flow

## Update Check Flow:

1. **App Launch** → Check for updates
2. **Compare** versionCode with GitHub latest
3. **If update available** → Show update dialog
4. **User accepts** → Download APK
5. **Download complete** → Request install permission
6. **Install APK** → Restart app

## Mock Update Dialog:

```
┌─────────────────────────────┐
│  🎉 New Update Available    │
├─────────────────────────────┤
│                             │
│  Version: 1.0.2             │
│  Current: 1.0.1             │
│                             │
│  What's New:                │
│  • Fixed notification sync  │
│  • Added history feature    │
│  • Improved UI            │
│                             │
│  Size: 15.4 MB              │
│                             │
├─────────────────────────────┤
│  [Later]    [Update Now]   │
└─────────────────────────────┘
```

## Download Progress Screen:

```
┌─────────────────────────────┐
│  📥 Downloading Update...   │
├─────────────────────────────┤
│                             │
│  [=================>   ]     │
│                             │
│  12.5 MB / 15.4 MB          │
│  81% Complete               │
│                             │
│  Time remaining: 15s        │
│                             │
├─────────────────────────────┤
│       [Cancel]              │
└─────────────────────────────┘
```

## Permissions Required (Android):

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" />
```

## FileProvider Configuration:

```xml
<!-- res/xml/file_paths.xml -->
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="downloads" path="Download/" />
    <cache-path name="cache" path="." />
</paths>
```

## Security Considerations:

1. **HTTPS Only**: All API calls and downloads use HTTPS
2. **APK Signature Verification**: Android verifies APK signature
3. **Version Code Validation**: Ensure versionCode increases
4. **Rollback Protection**: Prevent downgrades

## Error Handling:

| Error | Handling |
|-------|----------|
| No Internet | Silent fail, retry on next launch |
| API Failure | Log error, skip update check |
| Invalid URL | Show error dialog |
| Download Fail | Resume or restart download |
| Install Fail | Show manual install instructions |

## Implementation Notes:

### For Current Expo Project:
1. Eject to bare workflow first
2. Install `react-native-fs` for file operations
3. Install `rn-fetch-blob` for downloads
4. Configure FileProvider in AndroidManifest
5. Implement native module for APK install

### Alternative: Use Expo Updates (Recommended):
- Keep managed workflow
- Use `expo-updates` for OTA updates
- Use EAS Build for APK generation
- Distribute via GitHub Releases manually
- No in-app auto-update required
