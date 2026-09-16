/**
 * Ethiopian Time System Types and Constants
 *
 * In the Ethiopian 12-hour cyclical diurnal time format:
 * - The day begins at sunrise: 12:00 ጠዋት (06:00 AM Gregorian UTC+3)
 * - Midday is 06:00 ከሰዓት (12:00 PM Gregorian UTC+3)
 * - Sunset/dusk begins at 12:00 ማታ (06:00 PM Gregorian UTC+3)
 * - Midnight is 06:00 ሌሊት (12:00 AM Gregorian UTC+3)
 */

export type DiurnalPeriod = 'TEWAT' | 'KESEAT' | 'MATA' | 'LELIT';

export interface EthiopianTime {
  /**
   * Hour in 12-hour format: 1 to 12
   */
  hour: number;
  /**
   * Minute: 0 to 59
   */
  minute: number;
  /**
   * Diurnal segment (ጠዋት, ከሰዓት, ማታ, ሌሊት)
   */
  period: DiurnalPeriod;
}

export interface DiurnalPeriodMetadata {
  id: DiurnalPeriod;
  amharicLabel: string;
  englishLabel: string;
  hourRange: { start: number; end: number }; // In Ethiopian hours
  gregorianOffsetHours: number; // Base offset to add to Ethiopian hour
}

export const DIURNAL_PERIODS: Record<DiurnalPeriod, DiurnalPeriodMetadata> = {
  TEWAT: {
    id: 'TEWAT',
    amharicLabel: 'ጠዋት',
    englishLabel: 'Morning',
    hourRange: { start: 12, end: 5 },
    gregorianOffsetHours: 6,
  },
  KESEAT: {
    id: 'KESEAT',
    amharicLabel: 'ከሰዓት',
    englishLabel: 'Afternoon',
    hourRange: { start: 6, end: 11 },
    gregorianOffsetHours: 6,
  },
  MATA: {
    id: 'MATA',
    amharicLabel: 'ማታ',
    englishLabel: 'Evening',
    hourRange: { start: 12, end: 5 },
    gregorianOffsetHours: 18,
  },
  LELIT: {
    id: 'LELIT',
    amharicLabel: 'ሌሊት',
    englishLabel: 'Night',
    hourRange: { start: 6, end: 11 },
    gregorianOffsetHours: 18,
  },
};
