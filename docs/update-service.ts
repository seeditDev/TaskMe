// GitHub Auto-Update Service for TaskMe (React Native)
// This is a MOCK implementation showing the architecture
// For full APK install functionality, eject to bare workflow is required

import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const GITHUB_CONFIG = {
  owner: 'seeditDev',
  repo: 'TaskMe',
  apiBaseUrl: 'https://api.github.com/repos',
  releasesUrl: 'https://github.com/seeditDev/TaskMe/releases/latest',
};

// Storage keys
const STORAGE_KEYS = {
  lastVersionCheck: '@update_last_check',
  skippedVersion: '@update_skipped_version',
  downloadPath: '@update_download_path',
};

// Types
interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

interface UpdateInfo {
  versionName: string;
  versionCode: number;
  downloadUrl: string;
  changelog: string;
  size: number;
  isForced: boolean;
}

interface AppVersion {
  versionName: string;
  versionCode: number;
}

/**
 * GitHub Update Service
 * Handles checking for updates and downloading APKs from GitHub Releases
 */
class UpdateService {
  private static instance: UpdateService;
  private currentVersion: AppVersion = {
    versionName: '1.0.1',
    versionCode: 2,
  };

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Check for updates from GitHub Releases
   * Called on app launch
   */
  async checkForUpdate(): Promise<UpdateInfo | null> {
    try {
      // Check if we should skip this check (throttle)
      const shouldCheck = await this.shouldCheckForUpdate();
      if (!shouldCheck) {
        console.log('[Update] Skipping check - too soon');
        return null;
      }

      // Fetch latest release from GitHub API
      const release = await this.fetchLatestRelease();
      if (!release) {
        console.log('[Update] No release found');
        return null;
      }

      // Parse version info
      const updateInfo = this.parseReleaseInfo(release);
      if (!updateInfo) {
        console.log('[Update] Failed to parse release info');
        return null;
      }

      // Compare versions
      if (updateInfo.versionCode <= this.currentVersion.versionCode) {
        console.log('[Update] App is up to date');
        return null;
      }

      // Check if user skipped this version
      const skippedVersion = await this.getSkippedVersion();
      if (skippedVersion === updateInfo.versionName && !updateInfo.isForced) {
        console.log('[Update] User skipped this version');
        return null;
      }

      // Store last check time
      await this.setLastCheckTime();

      console.log('[Update] New version available:', updateInfo.versionName);
      return updateInfo;

    } catch (error) {
      console.error('[Update] Check failed:', error);
      return null;
    }
  }

  /**
   * Fetch latest release from GitHub API
   */
  private async fetchLatestRelease(): Promise<GitHubRelease | null> {
    try {
      const url = `${GITHUB_CONFIG.apiBaseUrl}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases/latest`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TaskMe-App',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as GitHubRelease;

    } catch (error) {
      console.error('[Update] API call failed:', error);
      return null;
    }
  }

  /**
   * Parse GitHub release into UpdateInfo
   */
  private parseReleaseInfo(release: GitHubRelease): UpdateInfo | null {
    // Find APK asset
    const apkAsset = release.assets.find(asset => 
      asset.name.endsWith('.apk')
    );

    if (!apkAsset) {
      console.error('[Update] No APK found in release');
      return null;
    }

    // Parse version from tag (v1.0.2 -> 1.0.2)
    const versionName = release.tag_name.replace(/^v/, '');
    
    // Extract version code (simplified - in real app, use version.json)
    const versionParts = versionName.split('.');
    const versionCode = parseInt(versionParts[2]) || 1;

    return {
      versionName,
      versionCode,
      downloadUrl: apkAsset.browser_download_url,
      changelog: release.body,
      size: apkAsset.size,
      isForced: false, // Set based on your requirements
    };
  }

  /**
   * Show update dialog
   */
  showUpdateDialog(updateInfo: UpdateInfo, onUpdate: () => void, onLater: () => void): void {
    const sizeMB = (updateInfo.size / (1024 * 1024)).toFixed(1);
    
    Alert.alert(
      '🎉 New Update Available',
      `Version: ${updateInfo.versionName}\n` +
      `Current: ${this.currentVersion.versionName}\n\n` +
      `What's New:\n${updateInfo.changelog}\n\n` +
      `Size: ${sizeMB} MB`,
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => {
            this.skipVersion(updateInfo.versionName);
            onLater();
          },
        },
        {
          text: 'Update Now',
          style: 'default',
          onPress: onUpdate,
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * Download APK from GitHub
   * Note: In Expo managed workflow, this requires ejecting
   */
  async downloadAPK(updateInfo: UpdateInfo, onProgress: (progress: number) => void): Promise<string | null> {
    try {
      console.log('[Update] Starting download:', updateInfo.downloadUrl);

      // For Expo managed workflow: Open browser to download
      if (this.isExpoManaged()) {
        await Linking.openURL(updateInfo.downloadUrl);
        return null;
      }

      // For bare workflow: Use native download manager
      // This requires native module implementation
      // Example with react-native-fs or rn-fetch-blob:
      
      /*
      import RNFetchBlob from 'rn-fetch-blob';
      
      const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/TaskMe-${updateInfo.versionName}.apk`;
      
      const res = await RNFetchBlob.config({
        fileCache: true,
        path: downloadPath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: 'Downloading TaskMe Update',
          description: `Version ${updateInfo.versionName}`,
          mime: 'application/vnd.android.package-archive',
        },
        progress: (received, total) => {
          const progress = received / total;
          onProgress(progress);
        },
      }).fetch('GET', updateInfo.downloadUrl, {
        'Accept': 'application/octet-stream',
      });

      return res.path();
      */

      return null;

    } catch (error) {
      console.error('[Update] Download failed:', error);
      return null;
    }
  }

  /**
   * Install APK
   * Note: Requires FileProvider and proper permissions in bare workflow
   */
  async installAPK(apkPath: string): Promise<boolean> {
    try {
      // For Expo managed workflow: Cannot install APK programmatically
      if (this.isExpoManaged()) {
        Alert.alert(
          'Manual Install Required',
          'Please install the downloaded APK manually from your Downloads folder.'
        );
        return false;
      }

      // For bare workflow: Use native intent
      /*
      import { NativeModules, Platform } from 'react-native';
      
      if (Platform.OS === 'android') {
        const { InstallApkModule } = NativeModules;
        await InstallApkModule.install(apkPath);
        return true;
      }
      */

      return false;

    } catch (error) {
      console.error('[Update] Install failed:', error);
      return false;
    }
  }

  /**
   * Get update check throttle status
   */
  private async shouldCheckForUpdate(): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.lastVersionCheck);
      if (!lastCheck) return true;

      const lastCheckTime = parseInt(lastCheck, 10);
      const now = Date.now();
      const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);

      // Check max once per 24 hours
      return hoursSinceLastCheck >= 24;

    } catch {
      return true;
    }
  }

  /**
   * Store last check time
   */
  private async setLastCheckTime(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.lastVersionCheck, Date.now().toString());
  }

  /**
   * Skip a specific version
   */
  private async skipVersion(version: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.skippedVersion, version);
  }

  /**
   * Get skipped version
   */
  private async getSkippedVersion(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.skippedVersion);
  }

  /**
   * Check if running in Expo managed workflow
   */
  private isExpoManaged(): boolean {
    // Check if native modules are available
    return !NativeModules.InstallApkModule;
  }

  /**
   * Share app link
   */
  async shareApp(): Promise<void> {
    try {
      const shareMessage = 
        `Check out TaskMe - Your personal task and note manager!\n\n` +
        `Download: ${GITHUB_CONFIG.releasesUrl}\n\n` +
        `Developed by SEED-ITES`;

      // Use React Native Share API
      /*
      import Share from 'react-native-share';
      
      await Share.open({
        title: 'Share TaskMe',
        message: shareMessage,
        url: GITHUB_CONFIG.releasesUrl,
      });
      */

      // Fallback: Open share dialog
      await Linking.openURL(`mailto:?subject=Check out TaskMe&body=${encodeURIComponent(shareMessage)}`);

    } catch (error) {
      console.error('[Update] Share failed:', error);
    }
  }

  /**
   * Generate QR code data
   */
  getQRCodeData(): string {
    return GITHUB_CONFIG.releasesUrl;
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): AppVersion {
    return this.currentVersion;
  }
}

// Export singleton instance
export const updateService = UpdateService.getInstance();

// React Hook for update checking
export function useUpdateCheck() {
  const [updateInfo, setUpdateInfo] = React.useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);

  const checkForUpdate = async () => {
    setIsChecking(true);
    const info = await updateService.checkForUpdate();
    setUpdateInfo(info);
    setIsChecking(false);
    return info;
  };

  const handleUpdate = async () => {
    if (!updateInfo) return;
    
    // Download APK
    const apkPath = await updateService.downloadAPK(updateInfo, (progress) => {
      console.log(`Download progress: ${(progress * 100).toFixed(1)}%`);
    });

    if (apkPath) {
      // Install APK
      await updateService.installAPK(apkPath);
    }
  };

  const skipUpdate = () => {
    if (updateInfo) {
      updateService.skipVersion(updateInfo.versionName);
      setUpdateInfo(null);
    }
  };

  React.useEffect(() => {
    checkForUpdate();
  }, []);

  return {
    updateInfo,
    isChecking,
    checkForUpdate,
    handleUpdate,
    skipUpdate,
  };
}

// Example usage in component:
/*
function HomeScreen() {
  const { updateInfo, isChecking, handleUpdate, skipUpdate } = useUpdateCheck();

  React.useEffect(() => {
    if (updateInfo) {
      updateService.showUpdateDialog(updateInfo, handleUpdate, skipUpdate);
    }
  }, [updateInfo]);

  return (
    <View>
      <Text>TaskMe Home</Text>
      {isChecking && <Text>Checking for updates...</Text>}
    </View>
  );
}
*/
