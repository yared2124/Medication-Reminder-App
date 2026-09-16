import { DiurnalPeriod, DIURNAL_PERIODS, EthiopianTime } from '../types/ethiopianTime';

/**
 * Converts an Ethiopian Time (12-hour cyclical format) into a 24-hour Gregorian Time { hour, minute }.
 *
 * Rules:
 * - TEWAT (ጠዋት / Morning: 12:00 - 5:59):
 *     12:00 -> 06:00, 1:00 -> 07:00, ..., 5:00 -> 11:00
 * - KESEAT (ከሰዓት / Afternoon: 6:00 - 11:59):
 *     6:00 -> 12:00, 7:00 -> 13:00, ..., 11:00 -> 17:00
 * - MATA (ማታ / Evening: 12:00 - 5:59):
 *     12:00 -> 18:00, 1:00 -> 19:00, ..., 5:00 -> 23:00
 * - LELIT (ሌሊት / Night: 6:00 - 11:59):
 *     6:00 -> 00:00, 7:00 -> 01:00, ..., 11:00 -> 05:00
 */
export function convertEthiopianToGregorianTime(ethiopianTime: EthiopianTime): {
  hour: number;
  minute: number;
} {
  const { hour, minute, period } = ethiopianTime;

  if (hour < 1 || hour > 12) {
    throw new Error(`Invalid Ethiopian hour: ${hour}. Must be between 1 and 12.`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Must be between 0 and 59.`);
  }

  let gregorianHour: number;

  switch (period) {
    case 'TEWAT': // Morning (06:00 - 11:59)
      gregorianHour = hour === 12 ? 6 : hour + 6;
      break;
    case 'KESEAT': // Afternoon (12:00 - 17:59)
      gregorianHour = hour + 6;
      break;
    case 'MATA': // Evening (18:00 - 23:59)
      gregorianHour = hour === 12 ? 18 : hour + 18;
      break;
    case 'LELIT': // Night (00:00 - 05:59)
      gregorianHour = (hour + 18) % 24;
      break;
    default: {
      const _exhaustiveCheck: never = period;
      throw new Error(`Unhandled period: ${_exhaustiveCheck}`);
    }
  }

  return {
    hour: gregorianHour,
    minute,
  };
}

/**
 * Converts a 24-hour Gregorian Time (hour 0-23, minute 0-59) or Date object into Ethiopian Time.
 */
export function convertGregorianToEthiopianTime(
  input: { hour: number; minute: number } | Date
): EthiopianTime {
  let gHour: number;
  let minute: number;

  if (input instanceof Date) {
    gHour = input.getHours();
    minute = input.getMinutes();
  } else {
    gHour = input.hour;
    minute = input.minute;
  }

  if (gHour < 0 || gHour > 23) {
    throw new Error(`Invalid Gregorian hour: ${gHour}. Must be between 0 and 23.`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Must be between 0 and 59.`);
  }

  let hour: number;
  let period: DiurnalPeriod;

  if (gHour >= 6 && gHour < 12) {
    // 06:00 - 11:59 -> ጠዋት (Morning)
    period = 'TEWAT';
    hour = gHour === 6 ? 12 : gHour - 6;
  } else if (gHour >= 12 && gHour < 18) {
    // 12:00 - 17:59 -> ከሰዓት (Afternoon)
    period = 'KESEAT';
    hour = gHour - 6;
  } else if (gHour >= 18 && gHour <= 23) {
    // 18:00 - 23:59 -> ማታ (Evening)
    period = 'MATA';
    hour = gHour === 18 ? 12 : gHour - 18;
  } else {
    // 00:00 - 05:59 -> ሌሊት (Night)
    period = 'LELIT';
    hour = gHour + 6;
  }

  return {
    hour,
    minute,
    period,
  };
}

/**
 * Returns a target Date object on a given reference date with the Gregorian hour and minute
 * computed from the given EthiopianTime.
 */
export function getGregorianDateFromEthiopian(
  ethiopianTime: EthiopianTime,
  referenceDate: Date = new Date()
): Date {
  const { hour, minute } = convertEthiopianToGregorianTime(ethiopianTime);
  const result = new Date(referenceDate.getTime());
  result.setHours(hour, minute, 0, 0);
  return result;
}

/**
 * Calculates the next upcoming occurrence timestamp (in ms epoch) for a given Ethiopian time.
 * If the computed time has already passed today, it calculates the occurrence for tomorrow.
 */
export function getNextDailyOccurrenceTimestamp(
  ethiopianTime: EthiopianTime,
  now: Date = new Date()
): number {
  const targetDate = getGregorianDateFromEthiopian(ethiopianTime, now);

  if (targetDate.getTime() <= now.getTime()) {
    // Has passed today, schedule for next day
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate.getTime();
}

/**
 * Formats Ethiopian time into user-friendly localized string.
 *
 * Example:
 * - formatEthiopianTime({ hour: 2, minute: 30, period: 'TEWAT' }, 'am') -> "ጠዋት 02:30"
 * - formatEthiopianTime({ hour: 2, minute: 30, period: 'TEWAT' }, 'en') -> "Morning 02:30"
 */
export function formatEthiopianTime(
  time: EthiopianTime,
  lang: 'am' | 'en' = 'am'
): string {
  const metadata = DIURNAL_PERIODS[time.period];
  const label = lang === 'am' ? metadata.amharicLabel : metadata.englishLabel;
  const formattedHour = time.hour.toString().padStart(2, '0');
  const formattedMinute = time.minute.toString().padStart(2, '0');

  return `${label} ${formattedHour}:${formattedMinute}`;
}

/**
 * Formats Gregorian 24h hour & minute into standard 12-hour AM/PM string for preview.
 * Example: { hour: 8, minute: 0 } -> "8:00 AM"
 */
export function formatGregorianTimePreview(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Validates if the selected hour fits the cultural diurnal segment rules:
 * - TEWAT: 12, 1, 2, 3, 4, 5
 * - KESEAT: 6, 7, 8, 9, 10, 11
 * - MATA: 12, 1, 2, 3, 4, 5
 * - LELIT: 6, 7, 8, 9, 10, 11
 */
export function isValidDiurnalHour(hour: number, period: DiurnalPeriod): boolean {
  if (hour < 1 || hour > 12) return false;

  switch (period) {
    case 'TEWAT':
    case 'MATA':
      return hour === 12 || (hour >= 1 && hour <= 5);
    case 'KESEAT':
    case 'LELIT':
      return hour >= 6 && hour <= 11;
    default:
      return false;
  }
}
