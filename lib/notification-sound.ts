// Notification Sound Service for playing reminder sounds
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { settingsStorage } from './storage';

// Local notification sound assets (bundled with app)
const SOUND_ASSETS = {
  notification1: require('../assets/sounds/notification1.mp3'),
  notification2: require('../assets/sounds/notification2.mp3'),
};

export type NotificationSoundType = 'default' | 'notification1' | 'notification2' | 'device';

class NotificationSoundService {
  private sound: Audio.Sound | null = null;
  private isWeb: boolean;

  constructor() {
    this.isWeb = typeof window !== 'undefined' && !navigator.userAgent.includes('ReactNative');
  }

  async init() {
    try {
      if (this.isWeb) {
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('Failed to init notification sound:', error);
    }
  }

  async playNotificationSound(soundType?: NotificationSoundType): Promise<void> {
    try {
      const settings = await settingsStorage.getSettings();
      const selectedSound = soundType || settings.notificationSound || 'notification1';
      
      if (this.isWeb) {
        this.playWebSound(selectedSound);
        return;
      }

      // For native platforms
      let soundSource = SOUND_ASSETS.notification1;
      if (selectedSound === 'device') {
        // Use system default
        return;
      } else if (selectedSound === 'notification2') {
        soundSource = SOUND_ASSETS.notification2;
      }

      const { sound } = await Audio.Sound.createAsync(
        soundSource as unknown as number,
        { shouldPlay: true, volume: 0.8 }
      );
      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private playWebSound(soundType: NotificationSoundType): void {
    try {
      if (soundType === 'device') return;
      
      const soundUri = soundType === 'default' 
        ? SOUND_ASSETS.notification1 
        : (SOUND_ASSETS[soundType as keyof typeof SOUND_ASSETS] || SOUND_ASSETS.notification1);
      
      const audio = new window.Audio(soundUri);
      audio.volume = 0.5;
      audio.play().catch((err: Error) => {
        console.warn('Web audio play failed:', err);
      });
    } catch (error) {
      console.warn('Web audio play failed:', error);
    }
  }

  async unloadSound(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
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
