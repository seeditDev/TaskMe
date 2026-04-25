// Notification Sound Service for playing reminder sounds
import { createAudioPlayer, AudioSource } from 'expo-audio';
import { settingsStorage } from './storage';

// Local notification sound assets (bundled with app)
const SOUND_ASSETS = {
  notification1: require('../assets/sounds/notification1.mp3'),
  notification2: require('../assets/sounds/notification2.mp3'),
};

export type NotificationSoundType = 'default' | 'notification1' | 'notification2' | 'device';

class NotificationSoundService {
  private isWeb: boolean;

  constructor() {
    // Check if running on web (navigator exists and doesn't include ReactNative)
    this.isWeb = typeof navigator !== 'undefined' && navigator?.userAgent?.includes('ReactNative') === false;
  }

  async init() {
    // No init needed for expo-audio
  }

  
  async playNotificationSound(soundType?: NotificationSoundType): Promise<void> {
    try {
      const settings = await settingsStorage.getSettings();
      const selectedSound = soundType || settings.notificationSound || 'notification1';
      
      if (this.isWeb) {
        this.playWebSound(selectedSound);
        return;
      }

      // For native platforms - skip if using device default
      if (selectedSound === 'device') {
        return;
      }

      // Get sound source
      const soundSource = selectedSound === 'notification2' 
        ? SOUND_ASSETS.notification2 
        : SOUND_ASSETS.notification1;

      // Use expo-audio createAudioPlayer (not hook)
      const player = createAudioPlayer(soundSource as AudioSource);
      player.play();
      
      // Auto-cleanup after playing
      setTimeout(() => {
        player.remove();
      }, 5000);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private playWebSound(soundType: NotificationSoundType): void {
    try {
      if (soundType === 'device') return;
      
      const soundSource = soundType === 'notification2' 
        ? SOUND_ASSETS.notification2 
        : SOUND_ASSETS.notification1;
      
      const audio = new window.Audio(soundSource);
      audio.volume = 0.5;
      audio.play().catch((err: Error) => {
        console.warn('Web audio play failed:', err);
      });
    } catch (error) {
      console.warn('Web audio play failed:', error);
    }
  }

  async unloadSound(): Promise<void> {
    // No-op for expo-audio
  }

  getAvailableSounds(): { id: NotificationSoundType; name: string }[] {
    return [
      { id: 'notification1', name: 'Notification 1' },
      { id: 'notification2', name: 'Notification 2' },
      { id: 'device', name: 'Device Default' },
    ];
  }

  // Play sound immediately (for testing/settings preview)
  async playTestSound(soundType: NotificationSoundType): Promise<void> {
    await this.playNotificationSound(soundType);
  }
}

export const notificationSound = new NotificationSoundService();
