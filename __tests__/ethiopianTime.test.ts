import {
  convertEthiopianToGregorianTime,
  convertGregorianToEthiopianTime,
  getGregorianDateFromEthiopian,
  getNextDailyOccurrenceTimestamp,
  formatEthiopianTime,
  formatGregorianTimePreview,
  isValidDiurnalHour,
} from '../src/utils/ethiopianTime';
import { EthiopianTime } from '../src/types/ethiopianTime';

describe('Ethiopian Time Conversion Engine', () => {
  describe('convertEthiopianToGregorianTime', () => {
    test('TEWAT (Morning: 12:00 - 5:59) maps to Gregorian 06:00 - 11:59', () => {
      // 12:00 ጠዋት -> 06:00
      expect(
        convertEthiopianToGregorianTime({ hour: 12, minute: 0, period: 'TEWAT' })
      ).toEqual({ hour: 6, minute: 0 });

      // 02:30 ጠዋት -> 08:30
      expect(
        convertEthiopianToGregorianTime({ hour: 2, minute: 30, period: 'TEWAT' })
      ).toEqual({ hour: 8, minute: 30 });

      // 05:59 ጠዋት -> 11:59
      expect(
        convertEthiopianToGregorianTime({ hour: 5, minute: 59, period: 'TEWAT' })
      ).toEqual({ hour: 11, minute: 59 });
    });

    test('KESEAT (Afternoon: 6:00 - 11:59) maps to Gregorian 12:00 - 17:59', () => {
      // 06:00 ከሰዓት (Midday) -> 12:00
      expect(
        convertEthiopianToGregorianTime({ hour: 6, minute: 0, period: 'KESEAT' })
      ).toEqual({ hour: 12, minute: 0 });

      // 08:15 ከሰዓት -> 14:15
      expect(
        convertEthiopianToGregorianTime({ hour: 8, minute: 15, period: 'KESEAT' })
      ).toEqual({ hour: 14, minute: 15 });

      // 11:59 ከሰዓት -> 17:59
      expect(
        convertEthiopianToGregorianTime({ hour: 11, minute: 59, period: 'KESEAT' })
      ).toEqual({ hour: 17, minute: 59 });
    });

    test('MATA (Evening: 12:00 - 5:59) maps to Gregorian 18:00 - 23:59', () => {
      // 12:00 ማታ (Sunset/Dusk) -> 18:00
      expect(
        convertEthiopianToGregorianTime({ hour: 12, minute: 0, period: 'MATA' })
      ).toEqual({ hour: 18, minute: 0 });

      // 02:00 ማታ -> 20:00
      expect(
        convertEthiopianToGregorianTime({ hour: 2, minute: 0, period: 'MATA' })
      ).toEqual({ hour: 20, minute: 0 });

      // 05:59 ማታ -> 23:59
      expect(
        convertEthiopianToGregorianTime({ hour: 5, minute: 59, period: 'MATA' })
      ).toEqual({ hour: 23, minute: 59 });
    });

    test('LELIT (Night: 6:00 - 11:59) maps to Gregorian 00:00 - 05:59', () => {
      // 06:00 ሌሊት (Midnight) -> 00:00
      expect(
        convertEthiopianToGregorianTime({ hour: 6, minute: 0, period: 'LELIT' })
      ).toEqual({ hour: 0, minute: 0 });

      // 08:00 ሌሊት -> 02:00
      expect(
        convertEthiopianToGregorianTime({ hour: 8, minute: 0, period: 'LELIT' })
      ).toEqual({ hour: 2, minute: 0 });

      // 11:59 ሌሊት -> 05:59
      expect(
        convertEthiopianToGregorianTime({ hour: 11, minute: 59, period: 'LELIT' })
      ).toEqual({ hour: 5, minute: 59 });
    });

    test('throws error on invalid hours and minutes', () => {
      expect(() =>
        convertEthiopianToGregorianTime({ hour: 0, minute: 0, period: 'TEWAT' })
      ).toThrow();
      expect(() =>
        convertEthiopianToGregorianTime({ hour: 13, minute: 0, period: 'TEWAT' })
      ).toThrow();
      expect(() =>
        convertEthiopianToGregorianTime({ hour: 6, minute: 60, period: 'KESEAT' })
      ).toThrow();
      expect(() =>
        convertEthiopianToGregorianTime({ hour: 6, minute: -1, period: 'KESEAT' })
      ).toThrow();
    });
  });

  describe('convertGregorianToEthiopianTime', () => {
    test('converts 06:00 - 11:59 to TEWAT', () => {
      expect(convertGregorianToEthiopianTime({ hour: 6, minute: 0 })).toEqual({
        hour: 12,
        minute: 0,
        period: 'TEWAT',
      });
      expect(convertGregorianToEthiopianTime({ hour: 8, minute: 30 })).toEqual({
        hour: 2,
        minute: 30,
        period: 'TEWAT',
      });
    });

    test('converts 12:00 - 17:59 to KESEAT', () => {
      expect(convertGregorianToEthiopianTime({ hour: 12, minute: 0 })).toEqual({
        hour: 6,
        minute: 0,
        period: 'KESEAT',
      });
      expect(convertGregorianToEthiopianTime({ hour: 15, minute: 45 })).toEqual({
        hour: 9,
        minute: 45,
        period: 'KESEAT',
      });
    });

    test('converts 18:00 - 23:59 to MATA', () => {
      expect(convertGregorianToEthiopianTime({ hour: 18, minute: 0 })).toEqual({
        hour: 12,
        minute: 0,
        period: 'MATA',
      });
      expect(convertGregorianToEthiopianTime({ hour: 20, minute: 10 })).toEqual({
        hour: 2,
        minute: 10,
        period: 'MATA',
      });
    });

    test('converts 00:00 - 05:59 to LELIT', () => {
      expect(convertGregorianToEthiopianTime({ hour: 0, minute: 0 })).toEqual({
        hour: 6,
        minute: 0,
        period: 'LELIT',
      });
      expect(convertGregorianToEthiopianTime({ hour: 3, minute: 15 })).toEqual({
        hour: 9,
        minute: 15,
        period: 'LELIT',
      });
    });

    test('handles Date objects directly', () => {
      const d = new Date(2026, 8, 16, 14, 20); // 14:20 Gregorian
      expect(convertGregorianToEthiopianTime(d)).toEqual({
        hour: 8,
        minute: 20,
        period: 'KESEAT',
      });
    });
  });

  describe('Bi-directional Roundtrip Integrity', () => {
    test('every 24 hour slot converts back and forth without data loss', () => {
      for (let h = 0; h < 24; h++) {
        for (let m of [0, 15, 30, 45, 59]) {
          const gregInput = { hour: h, minute: m };
          const ethiopian = convertGregorianToEthiopianTime(gregInput);
          const gregOutput = convertEthiopianToGregorianTime(ethiopian);
          expect(gregOutput).toEqual(gregInput);
        }
      }
    });
  });

  describe('Next Occurrence & Scheduling Math', () => {
    test('getGregorianDateFromEthiopian calculates reference date with Gregorian hours and minutes', () => {
      const refDate = new Date(2026, 8, 16, 0, 0);
      const ethiopianTime: EthiopianTime = { hour: 2, minute: 30, period: 'TEWAT' }; // 08:30 AM
      const targetDate = getGregorianDateFromEthiopian(ethiopianTime, refDate);

      expect(targetDate.getHours()).toBe(8);
      expect(targetDate.getMinutes()).toBe(30);
      expect(targetDate.getDate()).toBe(16);
    });

    test('getNextDailyOccurrenceTimestamp schedules for today if time is in future', () => {
      const now = new Date(2026, 8, 16, 7, 0); // 07:00 AM (01:00 ጠዋት)
      const futureTime: EthiopianTime = { hour: 2, minute: 0, period: 'TEWAT' }; // 08:00 AM
      const nextTimestamp = getNextDailyOccurrenceTimestamp(futureTime, now);
      const nextDate = new Date(nextTimestamp);

      expect(nextDate.getDate()).toBe(16);
      expect(nextDate.getHours()).toBe(8);
      expect(nextDate.getMinutes()).toBe(0);
    });

    test('getNextDailyOccurrenceTimestamp schedules for tomorrow if time has passed', () => {
      const now = new Date(2026, 8, 16, 9, 30); // 09:30 AM
      const pastTime: EthiopianTime = { hour: 2, minute: 0, period: 'TEWAT' }; // 08:00 AM
      const nextTimestamp = getNextDailyOccurrenceTimestamp(pastTime, now);
      const nextDate = new Date(nextTimestamp);

      expect(nextDate.getDate()).toBe(17); // Tomorrow
      expect(nextDate.getHours()).toBe(8);
      expect(nextDate.getMinutes()).toBe(0);
    });
  });

  describe('Formatting and Validation', () => {
    test('formatEthiopianTime outputs correct Amharic string', () => {
      expect(
        formatEthiopianTime({ hour: 2, minute: 30, period: 'TEWAT' }, 'am')
      ).toBe('ጠዋት 02:30');
      expect(
        formatEthiopianTime({ hour: 12, minute: 0, period: 'MATA' }, 'am')
      ).toBe('ማታ 12:00');
    });

    test('formatEthiopianTime outputs correct English string', () => {
      expect(
        formatEthiopianTime({ hour: 6, minute: 5, period: 'KESEAT' }, 'en')
      ).toBe('Afternoon 06:05');
      expect(
        formatEthiopianTime({ hour: 8, minute: 0, period: 'LELIT' }, 'en')
      ).toBe('Night 08:00');
    });

    test('formatGregorianTimePreview displays standard 12h format', () => {
      expect(formatGregorianTimePreview(8, 0)).toBe('8:00 AM');
      expect(formatGregorianTimePreview(12, 30)).toBe('12:30 PM');
      expect(formatGregorianTimePreview(20, 0)).toBe('8:00 PM');
      expect(formatGregorianTimePreview(0, 0)).toBe('12:00 AM');
    });

    test('isValidDiurnalHour enforces cultural hour boundaries', () => {
      // TEWAT: 12, 1-5
      expect(isValidDiurnalHour(12, 'TEWAT')).toBe(true);
      expect(isValidDiurnalHour(1, 'TEWAT')).toBe(true);
      expect(isValidDiurnalHour(5, 'TEWAT')).toBe(true);
      expect(isValidDiurnalHour(6, 'TEWAT')).toBe(false);

      // KESEAT: 6-11
      expect(isValidDiurnalHour(6, 'KESEAT')).toBe(true);
      expect(isValidDiurnalHour(11, 'KESEAT')).toBe(true);
      expect(isValidDiurnalHour(12, 'KESEAT')).toBe(false);

      // MATA: 12, 1-5
      expect(isValidDiurnalHour(12, 'MATA')).toBe(true);
      expect(isValidDiurnalHour(3, 'MATA')).toBe(true);
      expect(isValidDiurnalHour(7, 'MATA')).toBe(false);

      // LELIT: 6-11
      expect(isValidDiurnalHour(6, 'LELIT')).toBe(true);
      expect(isValidDiurnalHour(10, 'LELIT')).toBe(true);
      expect(isValidDiurnalHour(1, 'LELIT')).toBe(false);
    });
  });
});
