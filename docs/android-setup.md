# Android Setup for GitHub Auto-Update (Bare Workflow)

## Required Configuration

### 1. AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.taskme">

    <!-- Internet permission -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Download permissions -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" />
    
    <!-- Install unknown apps permission (Android 8.0+) -->
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="true"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|smallestScreenSize"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- FileProvider for APK installation -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
```

### 2. FileProvider Configuration

Create `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- External Downloads folder -->
    <external-path
        name="downloads"
        path="Download/" />
    
    <!-- External cache directory -->
    <external-cache-path
        name="external_cache"
        path="." />
    
    <!-- Internal cache directory -->
    <cache-path
        name="cache"
        path="." />
    
    <!-- Internal files directory -->
    <files-path
        name="files"
        path="." />
    
    <!-- External files directory -->
    <external-files-path
        name="external_files"
        path="." />
</paths>
```

### 3. Build Gradle Configuration

In `android/app/build.gradle`, ensure you have:

```gradle
android {
    namespace "com.taskme"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.taskme"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 2
        versionName "1.0.1"
    }
    
    // ... other config
}

dependencies {
    // React Native dependencies
    implementation "com.facebook.react:react-native:+"
    
    // FileProvider support
    implementation 'androidx.core:core:1.12.0'
    
    // OkHttp for API calls (if not already included)
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    
    // Kotlin coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

### 4. Native Module Registration

Create `android/app/src/main/java/com/taskme/update/UpdateManagerPackage.kt`:

```kotlin
package com.taskme.update

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class UpdateManagerPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(UpdateManager(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

### 5. Register Package in MainApplication

Update `android/app/src/main/java/com/taskme/MainApplication.kt`:

```kotlin
package com.taskme

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.taskme.update.UpdateManagerPackage

class MainApplication : Application(), ReactApplication {

    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> {
            return listOf(
                MainReactPackage(),
                UpdateManagerPackage() // Add this line
            )
        }

        override fun getJSMainModuleName(): String = "index"
    }

    override fun getReactNativeHost(): ReactNativeHost = mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        // ... other init code
    }
}
```

## Usage in React Native

### JavaScript Bridge

Create `src/native/UpdateManager.js`:

```javascript
import { NativeModules, Platform } from 'react-native';

const { UpdateManager } = NativeModules;

export default {
  checkForUpdate: () => UpdateManager.checkForUpdate(),
  downloadAPK: (url) => UpdateManager.downloadAPK(url),
  installAPK: (path) => UpdateManager.installAPK(path),
  skipVersion: (version) => UpdateManager.skipVersion(version),
  getReleasesURL: () => UpdateManager.getReleasesURL(),
  getCurrentVersion: () => UpdateManager.getCurrentVersion(),
  shareApp: () => UpdateManager.shareApp(),
};
```

### React Hook

Create `src/hooks/useAppUpdate.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import UpdateManager from '../native/UpdateManager';

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    
    setIsChecking(true);
    try {
      const info = await UpdateManager.checkForUpdate();
      if (info) {
        setUpdateInfo(info);
        showUpdateDialog(info);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const showUpdateDialog = (info) => {
    const sizeMB = (info.size / (1024 * 1024)).toFixed(1);
    
    Alert.alert(
      '🎉 New Update Available',
      `Version ${info.versionName} is now available!\n\n` +
      `Current: ${info.versionCode}\n` +
      `Size: ${sizeMB} MB\n\n` +
      `What's New:\n${info.changelog || 'Bug fixes and improvements'}`,
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => UpdateManager.skipVersion(info.versionName),
        },
        {
          text: 'Update Now',
          onPress: () => handleUpdate(info),
        },
      ],
      { cancelable: !info.isForced }
    );
  };

  const handleUpdate = async (info) => {
    try {
      const result = await UpdateManager.downloadAPK(info.downloadUrl);
      if (result && result.success) {
        await UpdateManager.installAPK(result.downloadPath);
      }
    } catch (error) {
      Alert.alert('Update Failed', error.message);
    }
  };

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    updateInfo,
    isChecking,
    downloadProgress,
    checkForUpdate,
  };
}
```

### Component Usage

```javascript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAppUpdate } from './hooks/useAppUpdate';

function SettingsScreen() {
  const { isChecking, checkForUpdate } = useAppUpdate();

  return (
    <View>
      <Text>TaskMe Settings</Text>
      
      <Button
        title={isChecking ? 'Checking...' : 'Check for Updates'}
        onPress={checkForUpdate}
        disabled={isChecking}
      />
    </View>
  );
}
```

## Testing the Update Flow

1. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Create GitHub Release**:
   - Go to https://github.com/seeditDev/TaskMe/releases
   - Click "Draft a new release"
   - Tag: `v1.0.2`
   - Title: `Version 1.0.2`
   - Attach: `app-release.apk`
   - Publish release

3. **Test Update**:
   - Install old version (1.0.1) on device
   - Launch app
   - Should detect update 1.0.2
   - Click "Update Now"
   - Download should start
   - Install prompt should appear

## Troubleshooting

### Issue: "Cannot install unknown apps"
**Solution**: Go to Settings > Apps > Special Access > Install Unknown Apps > Enable for your app

### Issue: "FileProvider not found"
**Solution**: Ensure FileProvider is registered in AndroidManifest.xml with correct authority

### Issue: "Download fails"
**Solution**: Check internet permission and storage permission in AndroidManifest.xml

### Issue: "API returns 403"
**Solution**: GitHub API has rate limits. Consider adding authentication or caching.

## QR Code Distribution

### Generate QR Code:

1. Online QR Generator: https://qr-code-generator.com
2. URL: `https://github.com/seeditDev/TaskMe/releases/latest`
3. Download PNG
4. Add to your website: https://seedit.site/taskme

### Website Page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Download TaskMe</title>
</head>
<body>
    <h1>TaskMe - Download</h1>
    <p>Your personal task and note manager</p>
    
    <img src="qr-code.png" alt="Scan to download" width="200">
    <p>Scan QR code with your phone camera</p>
    
    <a href="https://github.com/seeditDev/TaskMe/releases/latest">
        <button>Download APK</button>
    </a>
    
    <p>Developed by SEED-ITES | seedit.site</p>
</body>
</html>
```

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS for API calls and downloads
2. **APK Signature**: Ensure each APK is signed with same keystore
3. **Version Validation**: Verify versionCode increases
4. **Checksum Verification**: (Optional) Add SHA256 checksum validation
5. **Rate Limiting**: Cache API responses, don't check too frequently

## Next Steps

1. Eject from Expo: `npx expo eject`
2. Copy native module files to Android project
3. Configure AndroidManifest.xml
4. Test on physical device
5. Create GitHub release with APK
6. Share QR code
