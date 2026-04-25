# GitHub Auto-Update System for TaskMe

## 📁 Created Files

This directory contains the complete documentation for implementing a GitHub-based auto-update system:

| File | Description |
|------|-------------|
| `github-update-system.md` | Architecture overview and API documentation |
| `update-service.ts` | React Native service (TypeScript mock) |
| `UpdateManager.kt` | Native Android module (Kotlin) |
| `android-setup.md` | Android configuration guide |
| `README-GITHUB-UPDATE.md` | This file - implementation guide |

---

## 🚀 Two Implementation Paths

### Path 1: Expo Managed Workflow (Recommended - Easier)

**Limitations:**
- Cannot auto-download and install APK
- Must redirect user to browser/GitHub
- Use `expo-updates` for JS bundle updates only

**Implementation:**
```javascript
// Simple version check + redirect
import { Linking, Alert } from 'react-native';

async function checkForUpdate() {
  const response = await fetch(
    'https://api.github.com/repos/seeditDev/TaskMe/releases/latest'
  );
  const release = await response.json();
  const latestVersion = release.tag_name; // "v1.0.2"
  
  if (latestVersion !== currentVersion) {
    Alert.alert(
      'Update Available',
      'A new version is available on GitHub',
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: () => Linking.openURL(release.html_url)
        }
      ]
    );
  }
}
```

### Path 2: Bare Workflow (Full Auto-Update)

**Requirements:**
1. Eject from Expo: `npx expo eject`
2. Implement native Android module
3. Configure FileProvider
4. Handle permissions

**Steps:**

#### Step 1: Eject from Expo
```bash
npx expo eject
# This creates ios/ and android/ directories
```

#### Step 2: Copy Native Module
1. Copy `UpdateManager.kt` to `android/app/src/main/java/com/taskme/update/`
2. Copy `UpdateManagerPackage.kt` to same directory
3. Update `MainApplication.kt` to register package

#### Step 3: Configure AndroidManifest.xml
Add permissions and FileProvider as shown in `android-setup.md`

#### Step 4: Create FileProvider XML
Create `android/app/src/main/res/xml/file_paths.xml`

#### Step 5: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

#### Step 6: Upload to GitHub
1. Go to https://github.com/seeditDev/TaskMe/releases
2. Create new release
3. Attach `app-release.apk`
4. Publish

---

## 📱 User Flow

### For End Users:

1. **Download App**: Scan QR code or visit seedit.site/taskme
2. **Install**: Open APK file on Android device
3. **Enable Permissions**: Allow "Install unknown apps" if prompted
4. **Use App**: Normal app usage
5. **Update Check**: On launch, app checks GitHub for updates
6. **Update Available**: Dialog shows with version info
7. **Download**: Tap "Update Now" → Download starts
8. **Install**: System install prompt appears
9. **Restart**: App updates and restarts

### QR Code Distribution:

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐   │
│  │ ▄▄▄▄▄ ▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ │   │
│  │ █   █  █  █   █ █   █ │   │
│  │ █▄▄▄█  █  █▄▄▄█ █▄▄▄█ │   │
│  │ ▄▄▄▄▄  █  ▄▄▄▄▄     █ │   │
│  │ █   █  █  █   █ █   █ │   │
│  │ █▄▄▄█  █  █▄▄▄█ █▄▄▄█ │   │
│  └─────────────────────────┘   │
│                                 │
│    Scan to Download TaskMe      │
│        seedit.site/taskme       │
│                                 │
└─────────────────────────────────┘
```

---

## 🔗 GitHub Repository Setup

### Repository URL:
```
https://github.com/seeditDev/TaskMe
```

### Release Naming Convention:
```
Tag: v1.0.2
Name: Version 1.0.2
Assets: app-release.apk
```

### API Endpoint:
```
https://api.github.com/repos/seeditDev/TaskMe/releases/latest
```

### Download URL Format:
```
https://github.com/seeditDev/TaskMe/releases/download/v1.0.2/app-release.apk
```

---

## ⚙️ Configuration Variables

### UpdateManager.kt:
```kotlin
const val GITHUB_OWNER = "seeditDev"
const val GITHUB_REPO = "TaskMe"
```

### update-service.ts:
```javascript
const GITHUB_CONFIG = {
  owner: 'seeditDev',
  repo: 'TaskMe',
};
```

---

## 🎨 UI Mockups

### Update Dialog:
```
┌──────────────────────────────────┐
│                                  │
│          🎉 Update               │
│       New Version Available      │
│                                  │
│   Version: 1.0.2                 │
│   Current: 1.0.1                 │
│                                  │
│   What's New:                    │
│   • Fixed notification sync      │
│   • Added history feature        │
│   • Improved UI                  │
│                                  │
│   Size: 15.4 MB                  │
│                                  │
├──────────────────────────────────┤
│    [Later]        [Update Now]   │
└──────────────────────────────────┘
```

### Download Progress:
```
┌──────────────────────────────────┐
│      📥 Downloading Update...    │
│                                  │
│  [████████████████░░░░] 75%     │
│                                  │
│  11.5 MB / 15.4 MB               │
│  Time remaining: 10 seconds      │
│                                  │
├──────────────────────────────────┤
│          [Cancel Download]       │
└──────────────────────────────────┘
```

---

## 🔒 Security Checklist

- [ ] HTTPS only for all API calls
- [ ] APK signature verification enabled
- [ ] VersionCode validation (prevent downgrades)
- [ ] FileProvider properly configured
- [ ] Install permissions requested correctly
- [ ] Rate limiting on API calls

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot install" | Settings → Apps → Special Access → Install Unknown Apps → Enable |
| "Download failed" | Check internet & storage permissions |
| "FileProvider error" | Verify authority in AndroidManifest.xml |
| "API 403" | GitHub rate limit - add auth or cache |
| "Install blocked" | Disable Play Protect temporarily |

---

## 📊 Release Checklist

Before each release:

1. [ ] Increment `versionCode` in `build.gradle`
2. [ ] Update `versionName` in `build.gradle`
3. [ ] Write changelog in release notes
4. [ ] Build release APK: `./gradlew assembleRelease`
5. [ ] Test APK on physical device
6. [ ] Create GitHub release with tag
7. [ ] Attach APK to release
8. [ ] Publish release
9. [ ] Update website/QR code if needed
10. [ ] Test update flow from previous version

---

## 🌐 Website Integration

### Download Page (seedit.site/taskme):

```html
<!DOCTYPE html>
<html>
<head>
    <title>TaskMe - Download</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .qr-code { margin: 20px; }
        .download-btn { 
            background: #007AFF; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px;
            display: inline-block;
            margin: 20px;
        }
    </style>
</head>
<body>
    <h1>📝 TaskMe</h1>
    <p>Your personal task and note manager</p>
    
    <div class="qr-code">
        <img src="qr-code.png" alt="Scan to download" width="200">
        <p>Scan with your camera to download</p>
    </div>
    
    <a href="https://github.com/seeditDev/TaskMe/releases/latest" class="download-btn">
        Download APK
    </a>
    
    <p>Version 1.0.2 | Android 5.0+</p>
    <p>Developed by <a href="https://seedit.site">SEED-ITES</a></p>
</body>
</html>
```

---

## 🚀 Next Steps

### Immediate Actions:
1. Decide: Expo Managed vs Bare workflow
2. If Bare: Run `npx expo eject`
3. Copy native module files
4. Configure Android manifest
5. Build test APK
6. Create GitHub release
7. Generate QR code
8. Test update flow

### For Your Current Project:
Since TaskMe is currently an **Expo Managed** project, you have two options:

**Option A - Quick (Recommended for now):**
- Add simple version check
- Redirect to GitHub releases page
- Manual APK install by user
- No auto-update functionality

**Option B - Full Implementation:**
- Eject to bare workflow
- Implement all native modules
- Full auto-update capability
- More complex but complete solution

---

## 📞 Support

Repository: https://github.com/seeditDev/TaskMe  
Website: https://seedit.site  
Developer: Ashok Selva Kumar E  
Company: SEED-ITES

---

**Mock Implementation Complete! 🎉**

All code is ready to be integrated. Choose your path (Expo Managed or Bare) and follow the corresponding guide above.
