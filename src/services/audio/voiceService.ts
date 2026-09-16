import { Audio } from 'expo-av';

// Bundled native Amharic studio audio clips
// 100% offline, crystal-clear, authentic native Ethiopian voice
const reminderSound = require('../../../assets/audio/reminder_amharic.mp3');
const takenSound = require('../../../assets/audio/taken_amharic.mp3');
const lowStockSound = require('../../../assets/audio/low_stock_amharic.mp3');

export class AmharicVoiceService {
  private currentSound: Audio.Sound | null = null;

  /**
   * Plays crystal-clear native Amharic audio:
   * "መድሃኒትዎን የሚወስዱበት ሰዓት ደርሷል"
   * (It is time to take your medication)
   */
  async speakReminder(
    _patientName?: string,
    _medicationName?: string,
    _dosage?: string,
    _mealTimingAmharic?: string
  ): Promise<void> {
    await this.playAudioClip(reminderSound);
  }

  /**
   * Plays reassuring native Amharic audio:
   * "መድሃኒትዎ ተመዝግቧል። ጤና ይስጥልዎ!"
   * (Your medication is recorded. Wishing you good health!)
   */
  async speakTakenConfirmation(): Promise<void> {
    await this.playAudioClip(takenSound);
  }

  /**
   * Plays warning native Amharic audio:
   * "ማስጠንቀቂያ፡ የመድሃኒት ክምችት እያለቀ ነው"
   * (Warning: Medication stock is running low)
   */
  async speakLowStockAlert(): Promise<void> {
    await this.playAudioClip(lowStockSound);
  }

  /**
   * Plays pre-bundled native Amharic MP3 clip with full volume affordance
   */
  private async playAudioClip(source: any): Promise<void> {
    try {
      // Stop and clean up any currently playing sound
      if (this.currentSound) {
        try {
          await this.currentSound.stopAsync();
          await this.currentSound.unloadAsync();
        } catch {
          // Ignore
        }
        this.currentSound = null;
      }

      // Configure hardware audio mode for high clarity
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          volume: 1.0,
        }
      );

      this.currentSound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          this.currentSound = null;
        }
      });
    } catch (error) {
      console.warn('Amharic audio playback error:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch {
        // Ignore
      }
      this.currentSound = null;
    }
  }
}

export const voiceService = new AmharicVoiceService();
