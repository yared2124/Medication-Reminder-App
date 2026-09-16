import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

// Bundled native Amharic studio audio clips
// 100% offline, crystal-clear, authentic native Ethiopian voice
const reminderSound = require('../../../assets/audio/reminder_amharic.mp3');
const takenSound = require('../../../assets/audio/taken_amharic.mp3');
const lowStockSound = require('../../../assets/audio/low_stock_amharic.mp3');

export class AmharicVoiceService {
  private currentPlayer: any = null;

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
   * Plays pre-bundled native Amharic MP3 clip using Expo SDK 57 expo-audio
   */
  private async playAudioClip(source: any): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      // Stop and clean up any currently playing sound
      if (this.currentPlayer) {
        try {
          this.currentPlayer.pause();
        } catch {
          // Ignore
        }
        this.currentPlayer = null;
      }

      const player = createAudioPlayer(source);
      this.currentPlayer = player;
      player.play();
    } catch (error) {
      console.warn('Amharic audio playback error:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause();
      } catch {
        // Ignore
      }
      this.currentPlayer = null;
    }
  }
}

export const voiceService = new AmharicVoiceService();
