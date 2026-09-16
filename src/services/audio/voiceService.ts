import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export class AmharicVoiceService {
  private isSpeaking: boolean = false;

  /**
   * Speaks the medication reminder in respectful, crystal-clear Amharic.
   * Paced slightly slower (rate: 0.85) so elderly listeners can easily understand every word.
   *
   * Example:
   * "እማማ፣ የደም ግፊት መድሃኒት (1 ኪኒን - ከምግብ በኋላ) የመውሰጃ ሰዓት ደርሷል።"
   */
  async speakReminder(
    patientName: string,
    medicationName: string,
    dosage: string,
    mealTimingAmharic: string
  ): Promise<void> {
    const text = `${patientName}፣ የ${medicationName} መድሃኒት፣ ${dosage} ${mealTimingAmharic}፣ የመውሰጃ ሰዓት ደርሷል።`;
    await this.speakText(text);
  }

  /**
   * Reassuring spoken confirmation when a dose is taken.
   * "መድሃኒትዎ ተመዝግቧል። ጤና ይስጥልዎ!"
   */
  async speakTakenConfirmation(): Promise<void> {
    const text = 'መድሃኒትዎ ተመዝግቧል። ጤና ይስጥልዎ!';
    await this.speakText(text, { rate: 0.9 });
  }

  /**
   * Spoken warning when stock is low.
   * "ማስጠንቀቂያ፡ የመድሃኒት ክምችት እያለቀ ነው።"
   */
  async speakLowStockAlert(medicationName: string, count: number): Promise<void> {
    const text = `ማስጠንቀቂያ፡ የ${medicationName} መድሃኒት ክምችት ሊያልቅ ተቃርቧል። ቀሪ፡ ${count} ኪኒን።`;
    await this.speakText(text);
  }

  /**
   * General text-to-speech speaker using Amharic voice with fallback
   */
  async speakText(text: string, options?: { rate?: number; pitch?: number }): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      // Stop any active speech first
      await this.stop();

      this.isSpeaking = true;

      Speech.speak(text, {
        language: 'am-ET', // Amharic (Ethiopia)
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.85, // Friendly, calm cadence for elderly users
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.warn('Amharic speech playback error:', error);
      this.isSpeaking = false;
    }
  }

  /**
   * Stops any currently speaking audio
   */
  async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch {
      // Ignore
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceService = new AmharicVoiceService();
