import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  checkForUpdate,
  showUpdateDialog,
  handleUpdateFlow,
  skipVersion,
  UpdateInfo,
  AppVersion,
  getCurrentVersion,
} from '@/lib/update-manager';

interface UseAppUpdateReturn {
  updateInfo: UpdateInfo | null;
  currentVersion: AppVersion | null;
  isChecking: boolean;
  isDownloading: boolean;
  checkForUpdate: () => Promise<void>;
  handleUpdate: () => Promise<void>;
  skipUpdate: () => Promise<void>;
}

/**
 * React hook for app update functionality
 * Automatically checks for updates on mount (Android only)
 */
export function useAppUpdate(): UseAppUpdateReturn {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState<AppVersion | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get current version on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      getCurrentVersion().then(version => {
        if (version) {
          setCurrentVersion(version);
        }
      });
    }
  }, []);

  /**
   * Check for available updates
   */
  const checkForUpdateHandler = useCallback(async () => {
    if (Platform.OS !== 'android') {
      console.log('[useAppUpdate] Only supported on Android');
      return;
    }

    setIsChecking(true);
    try {
      const info = await checkForUpdate();
      if (info) {
        setUpdateInfo(info);
        showUpdateDialog(
          info,
          async () => {
            // User clicked "Update Now"
            await handleUpdateHandler();
          },
          async () => {
            // User clicked "Later"
            await skipUpdateHandler();
          }
        );
      } else {
        console.log('[useAppUpdate] No update available');
      }
    } catch (error) {
      console.error('[useAppUpdate] Check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Handle update download and install
   */
  const handleUpdateHandler = useCallback(async () => {
    if (!updateInfo) return;

    setIsDownloading(true);
    try {
      await handleUpdateFlow(updateInfo);
      // Note: App will restart after install, so we don't need to clear state
    } catch (error) {
      console.error('[useAppUpdate] Update failed:', error);
      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update app',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  }, [updateInfo]);

  /**
   * Skip current update
   */
  const skipUpdateHandler = useCallback(async () => {
    if (updateInfo) {
      await skipVersion(updateInfo.versionName);
      setUpdateInfo(null);
    }
  }, [updateInfo]);

  // Auto-check on mount (only once per day is handled natively)
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Delay slightly to not interfere with app startup
      const timer = setTimeout(() => {
        checkForUpdateHandler();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [checkForUpdateHandler]);

  return {
    updateInfo,
    currentVersion,
    isChecking,
    isDownloading,
    checkForUpdate: checkForUpdateHandler,
    handleUpdate: handleUpdateHandler,
    skipUpdate: skipUpdateHandler,
  };
}
