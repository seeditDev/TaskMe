/**
 * GitHub Auto-Update Manager
 * React Native bridge for native Android update functionality
 */

import { NativeModules, Platform, Alert, Linking } from 'react-native';

const { UpdateManager } = NativeModules;

export interface UpdateInfo {
  versionName: string;
  versionCode: number;
  downloadUrl: string;
  changelog: string;
  size: number;
  isForced: boolean;
}

export interface AppVersion {
  versionName: string;
  versionCode: number;
}

/**
 * Check for updates from GitHub
 * Returns UpdateInfo if update available, null otherwise
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (Platform.OS !== 'android') {
    console.log('[Update] Only supported on Android');
    return null;
  }

  try {
    const result = await UpdateManager.checkForUpdate();
    return result as UpdateInfo | null;
  } catch (error) {
    console.error('[Update] Check failed:', error);
    return null;
  }
}

/**
 * Download APK from GitHub
 */
export async function downloadAPK(downloadUrl: string): Promise<{ downloadPath: string; success: boolean } | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const result = await UpdateManager.downloadAPK(downloadUrl);
    return result as { downloadPath: string; success: boolean };
  } catch (error) {
    console.error('[Update] Download failed:', error);
    throw error;
  }
}

/**
 * Install downloaded APK
 */
export async function installAPK(apkPath: string): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await UpdateManager.installAPK(apkPath);
  } catch (error) {
    console.error('[Update] Install failed:', error);
    throw error;
  }
}

/**
 * Skip a specific version
 */
export async function skipVersion(versionName: string): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await UpdateManager.skipVersion(versionName);
  } catch (error) {
    console.error('[Update] Skip failed:', error);
    return false;
  }
}

/**
 * Get GitHub releases URL
 */
export async function getReleasesURL(): Promise<string> {
  if (Platform.OS !== 'android') {
    return 'https://github.com/seeditDev/TaskMe/releases/latest';
  }

  try {
    return await UpdateManager.getReleasesURL();
  } catch (error) {
    return 'https://github.com/seeditDev/TaskMe/releases/latest';
  }
}

/**
 * Get current app version
 */
export async function getCurrentVersion(): Promise<AppVersion | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return await UpdateManager.getCurrentVersion() as AppVersion;
  } catch (error) {
    console.error('[Update] Get version failed:', error);
    return null;
  }
}

/**
 * Share app link
 */
export async function shareApp(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await UpdateManager.shareApp();
  } catch (error) {
    console.error('[Update] Share failed:', error);
    return false;
  }
}

/**
 * Show update dialog with version info
 */
export function showUpdateDialog(
  updateInfo: UpdateInfo,
  onUpdate: () => void,
  onLater: () => void
): void {
  const sizeMB = (updateInfo.size / (1024 * 1024)).toFixed(1);
  const changelog = updateInfo.changelog || 'Bug fixes and improvements';
  
  // Truncate changelog if too long
  const maxLength = 200;
  const truncatedChangelog = changelog.length > maxLength 
    ? changelog.substring(0, maxLength) + '...'
    : changelog;

  Alert.alert(
    '🎉 New Update Available',
    `Version ${updateInfo.versionName} is now available!\n\n` +
    `Current: ${updateInfo.versionCode}\n` +
    `Size: ${sizeMB} MB\n\n` +
    `What's New:\n${truncatedChangelog}`,
    [
      {
        text: 'Later',
        style: 'cancel',
        onPress: onLater,
      },
      {
        text: 'Update Now',
        onPress: onUpdate,
      },
    ],
    { cancelable: !updateInfo.isForced }
  );
}

/**
 * Handle complete update flow
 */
export async function handleUpdateFlow(updateInfo: UpdateInfo): Promise<void> {
  try {
    // Download APK
    console.log('[Update] Starting download...');
    const downloadResult = await downloadAPK(updateInfo.downloadUrl);
    
    if (!downloadResult || !downloadResult.success) {
      throw new Error('Download failed');
    }

    console.log('[Update] Download complete:', downloadResult.downloadPath);

    // Install APK
    console.log('[Update] Starting install...');
    await installAPK(downloadResult.downloadPath);
    
    console.log('[Update] Install prompt shown');
  } catch (error) {
    console.error('[Update] Flow failed:', error);
    Alert.alert(
      'Update Failed',
      error instanceof Error ? error.message : 'Failed to update app. Please try again later.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Open GitHub releases page in browser
 */
export async function openReleasesPage(): Promise<void> {
  const url = await getReleasesURL();
  Linking.openURL(url);
}

// Default export
export default {
  checkForUpdate,
  downloadAPK,
  installAPK,
  skipVersion,
  getReleasesURL,
  getCurrentVersion,
  shareApp,
  showUpdateDialog,
  handleUpdateFlow,
  openReleasesPage,
};
