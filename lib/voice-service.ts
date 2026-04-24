// Voice service using expo-speech (already included in project dependencies)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechModule = any;

let speechModule: SpeechModule | null = null;

async function getSpeechModule(): Promise<SpeechModule | null> {
  if (speechModule) return speechModule;
  try {
    // Dynamic import to load expo-speech at runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    speechModule = require("expo-speech");
    return speechModule;
  } catch (error) {
    console.warn("expo-speech not available:", error);
    return null;
  }
}

export const voiceService = {
  async speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    try {
      const Speech = await getSpeechModule();
      if (!Speech) return;
      
      await Speech.speak(text, {
        language: "en-US",
        rate: options?.rate || 1,
        pitch: options?.pitch || 1,
        volume: options?.volume || 1,
      });
    } catch (error) {
      console.error("Error speaking:", error);
    }
  },

  async stop() {
    try {
      const Speech = await getSpeechModule();
      if (!Speech) return;
      await Speech.stop();
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  },

  async pause() {
    try {
      const Speech = await getSpeechModule();
      if (!Speech) return;
      await Speech.pause();
    } catch (error) {
      console.error("Error pausing speech:", error);
    }
  },

  async resume() {
    try {
      const Speech = await getSpeechModule();
      if (!Speech) return;
      await Speech.resume();
    } catch (error) {
      console.error("Error resuming speech:", error);
    }
  },

  async getAvailableVoices() {
    try {
      const Speech = await getSpeechModule();
      if (!Speech) return [];
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error("Error getting available voices:", error);
      return [];
    }
  },

  async isSpeaking(): Promise<boolean> {
    try {
      const Speech = await getSpeechModule();
      if (!Speech) return false;
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error("Error checking speech status:", error);
      return false;
    }
  },

  onSpeechStart(callback: () => void) {
    getSpeechModule().then((Speech) => {
      if (Speech) Speech.addSpeakingStartedListener(callback);
    });
  },

  onSpeechFinish(callback: () => void) {
    getSpeechModule().then((Speech) => {
      if (Speech) Speech.addSpeakingFinishedListener(callback);
    });
  },

  onSpeechError(callback: (error: any) => void) {
    getSpeechModule().then((Speech) => {
      if (Speech) Speech.addSpeakingErrorListener(callback);
    });
  },

  async playNotificationSound() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Audio } = require("expo-audio");
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/notification.mp3")
      );
      await sound.playAsync();
    } catch (error) {
      // Fallback or ignore if sound file doesn't exist yet
      console.warn("Could not play custom sound:", error);
    }
  },
};

// Speech recognition service using Web Speech API for React Native
// For production, consider using @react-native-voice/voice or expo-speech-recognition

type SpeechRecognitionCallback = (text: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;

class SpeechRecognitionService {
  private isListening: boolean = false;
  private recognition: any = null;
  private onResultCallback: SpeechRecognitionCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  async requestPermissions(): Promise<boolean> {
    // On web, permissions are handled by the browser
    // On mobile, we'd need expo-permissions or similar
    return true;
  }

  async startListening(
    onResult: SpeechRecognitionCallback,
    onError?: ErrorCallback,
    language: string = "en-US"
  ): Promise<void> {
    try {
      this.onResultCallback = onResult;
      this.onErrorCallback = onError || null;

      // Check if running on web or native
      if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
        // Use Web Speech API
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = language;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.onResultCallback) {
            if (finalTranscript) {
              this.onResultCallback(finalTranscript, true);
            } else if (interimTranscript) {
              this.onResultCallback(interimTranscript, false);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          // Suppress common harmless errors
          if (event.error === "aborted" || event.error === "no-speech") {
            console.log(`Speech recognition ${event.error} (handled)`);
          } else {
            console.error("Speech recognition error:", event.error);
            if (this.onErrorCallback) {
              this.onErrorCallback(event.error);
            }
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };

        this.recognition.start();
        this.isListening = true;
      } else {
        // Fallback for React Native - simulate with expo-speech (TTS only)
        // In production, integrate with @react-native-voice/voice
        console.warn("Speech recognition not available. Using text input fallback.");
        if (this.onErrorCallback) {
          this.onErrorCallback("Speech recognition not available on this platform");
        }
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(String(error));
      }
    }
  }

  async stopListening(): Promise<string> {
    return new Promise((resolve) => {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition.onend = () => {
          this.isListening = false;
          resolve("");
        };
      } else {
        this.isListening = false;
        resolve("");
      }
    });
  }

  getListeningState(): boolean {
    return this.isListening;
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
    this.isListening = false;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();

// Helper for one-time speech recognition
export async function listenForSpeech(duration: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let finalText = "";
    const timeout = setTimeout(() => {
      speechRecognitionService.stopListening();
      resolve(finalText);
    }, duration);

    speechRecognitionService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          finalText = text;
          clearTimeout(timeout);
          speechRecognitionService.stopListening();
          resolve(text);
        }
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}
