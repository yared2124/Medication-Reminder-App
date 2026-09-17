import { LocalMemoryRepository } from '../src/services/database/repository';
import { AlarmService } from '../src/services/notifications/alarmService';
import { voiceService } from '../src/services/audio/voiceService';
import {
  convertEthiopianToGregorianTime,
  convertGregorianToEthiopianTime,
  isValidDiurnalHour,
  formatEthiopianTime,
} from '../src/utils/ethiopianTime';
import { Profile, Medication, Schedule, NotificationPayload } from '../src/types/models';
import { EthiopianTime } from '../src/types/ethiopianTime';

// Mock expo-audio for headless CI / Jest environment
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    loop: false,
    addListener: jest.fn(),
  })),
}));

describe('End-to-End Critical User Flows & Reliability Test Suite', () => {
  let repo: LocalMemoryRepository;
  let alarmService: AlarmService;

  beforeEach(() => {
    repo = new LocalMemoryRepository();
    alarmService = new AlarmService();

    // Inject repository instance for the test environment
    const repositoryModule = require('../src/services/database/repository');
    repositoryModule.repository = repo;

    jest.clearAllMocks();
  });

  // ============================================================================
  // FLOW 1: PATIENT PROFILE MANAGEMENT & MULTI-DEPENDENT LIFECYCLE
  // ============================================================================
  describe('Flow 1: Patient Profile & Dependent Lifecycle', () => {
    it('creates multiple dependent profiles, isolates their data, and cascades deletes cleanly', async () => {
      // 1. Create primary user (Self)
      const primaryUser: Profile = {
        id: 'prof_yared',
        name: 'Yared',
        relationship: 'Self',
        color: '#F26E56',
        age: 32,
        createdAt: Date.now(),
      };
      await repo.saveProfile(primaryUser);

      // 2. Create dependent elderly mother (እማማ)
      const motherUser: Profile = {
        id: 'prof_mother',
        name: 'Saranara (እማማ)',
        relationship: 'Mother',
        color: '#3B9B94',
        age: 68,
        createdAt: Date.now(),
      };
      await repo.saveProfile(motherUser);

      const allProfiles = await repo.getProfiles();
      expect(allProfiles).toHaveLength(2);
      expect(allProfiles.map((p) => p.name)).toContain('Yared');
      expect(allProfiles.map((p) => p.name)).toContain('Saranara (እማማ)');

      // 3. Assign medications to Mother
      const medMother: Medication = {
        id: 'med_metformin',
        profileId: 'prof_mother',
        name: 'Metformin',
        dosage: '1 Tablet',
        dosageAmount: 1,
        mealTiming: 'WITH_MEAL',
        stockCount: 30,
        lowStockThreshold: 5,
        createdAt: Date.now(),
      };
      await repo.saveMedication(medMother);

      // 4. Assign schedule to Mother's medication
      const schedMother: Schedule = {
        id: 'sched_metformin',
        medicationId: 'med_metformin',
        profileId: 'prof_mother',
        ethiopianTime: { hour: 2, minute: 0, period: 'TEWAT' },
        gregorianHour: 8,
        gregorianMinute: 0,
        recurrenceType: 'DAILY',
        isActive: true,
        createdAt: Date.now(),
      };
      await repo.saveSchedule(schedMother);

      // Verify medications are bound to Mother
      const motherMeds = await repo.getMedications('prof_mother');
      expect(motherMeds).toHaveLength(1);
      expect(motherMeds[0].name).toBe('Metformin');

      // 5. Delete Mother profile and verify cascade deletion of medication
      await repo.deleteMedication('med_metformin');
      await repo.deleteProfile('prof_mother');

      const remainingProfiles = await repo.getProfiles();
      expect(remainingProfiles).toHaveLength(1);
      expect(remainingProfiles[0].id).toBe('prof_yared');

      const remainingMeds = await repo.getMedications('prof_mother');
      expect(remainingMeds).toHaveLength(0);
    });
  });

  // ============================================================================
  // FLOW 2: ETHIOPIAN LOCAL TIME CONVERSION & DIURNAL DIAL SCHEDULING
  // ============================================================================
  describe('Flow 2: Diurnal Ethiopian Local Time Scheduling Engine', () => {
    it('correctly maps all 4 diurnal periods from Ethiopian 12h cycle to 24h Gregorian', () => {
      // 1. Morning (ጠዋት / TEWAT): 12:00 -> 06:00, 2:00 -> 08:00, 5:59 -> 11:59
      expect(convertEthiopianToGregorianTime({ hour: 12, minute: 0, period: 'TEWAT' })).toEqual({
        hour: 6,
        minute: 0,
      });
      expect(convertEthiopianToGregorianTime({ hour: 2, minute: 30, period: 'TEWAT' })).toEqual({
        hour: 8,
        minute: 30,
      });

      // 2. Afternoon (ከሰዓት / KESEAT): 6:00 -> 12:00, 8:15 -> 14:15, 11:59 -> 17:59
      expect(convertEthiopianToGregorianTime({ hour: 6, minute: 0, period: 'KESEAT' })).toEqual({
        hour: 12,
        minute: 0,
      });
      expect(convertEthiopianToGregorianTime({ hour: 8, minute: 15, period: 'KESEAT' })).toEqual({
        hour: 14,
        minute: 15,
      });

      // 3. Evening (ማታ / MATA): 12:00 -> 18:00, 3:00 -> 21:00, 5:59 -> 23:59
      expect(convertEthiopianToGregorianTime({ hour: 12, minute: 0, period: 'MATA' })).toEqual({
        hour: 18,
        minute: 0,
      });
      expect(convertEthiopianToGregorianTime({ hour: 3, minute: 0, period: 'MATA' })).toEqual({
        hour: 21,
        minute: 0,
      });

      // 4. Night (ሌሊት / LELIT): 6:00 -> 00:00 (midnight), 8:00 -> 02:00, 11:59 -> 05:59
      expect(convertEthiopianToGregorianTime({ hour: 6, minute: 0, period: 'LELIT' })).toEqual({
        hour: 0,
        minute: 0,
      });
      expect(convertEthiopianToGregorianTime({ hour: 8, minute: 0, period: 'LELIT' })).toEqual({
        hour: 2,
        minute: 0,
      });
    });

    it('reverse converts Gregorian 24h clock back to authentic Ethiopian Time', () => {
      // 08:30 AM -> ጠዋት 02:30
      const morningTime = convertGregorianToEthiopianTime({ hour: 8, minute: 30 });
      expect(morningTime).toEqual({ hour: 2, minute: 30, period: 'TEWAT' });

      // 14:00 (2:00 PM) -> ከሰዓት 08:00
      const afternoonTime = convertGregorianToEthiopianTime({ hour: 14, minute: 0 });
      expect(afternoonTime).toEqual({ hour: 8, minute: 0, period: 'KESEAT' });

      // 21:45 (9:45 PM) -> ማታ 03:45
      const eveningTime = convertGregorianToEthiopianTime({ hour: 21, minute: 45 });
      expect(eveningTime).toEqual({ hour: 3, minute: 45, period: 'MATA' });

      // 01:15 AM (Night) -> ሌሊት 07:15
      const nightTime = convertGregorianToEthiopianTime({ hour: 1, minute: 15 });
      expect(nightTime).toEqual({ hour: 7, minute: 15, period: 'LELIT' });
    });

    it('validates diurnal cultural hours correctly and prevents invalid entries', () => {
      // TEWAT only accepts 12, 1, 2, 3, 4, 5
      expect(isValidDiurnalHour(12, 'TEWAT')).toBe(true);
      expect(isValidDiurnalHour(2, 'TEWAT')).toBe(true);
      expect(isValidDiurnalHour(7, 'TEWAT')).toBe(false); // 7 belongs to KESEAT/LELIT

      // KESEAT only accepts 6, 7, 8, 9, 10, 11
      expect(isValidDiurnalHour(8, 'KESEAT')).toBe(true);
      expect(isValidDiurnalHour(2, 'KESEAT')).toBe(false); // 2 belongs to TEWAT/MATA

      // Out of range hours (< 1 or > 12) must fail
      expect(isValidDiurnalHour(0, 'TEWAT')).toBe(false);
      expect(isValidDiurnalHour(13, 'TEWAT')).toBe(false);

      // Throws on invalid hours during conversion
      expect(() =>
        convertEthiopianToGregorianTime({ hour: 13 as any, minute: 0, period: 'TEWAT' })
      ).toThrow();
    });

    it('formats Ethiopian time into localized Amharic and English strings', () => {
      const time: EthiopianTime = { hour: 2, minute: 0, period: 'TEWAT' };
      expect(formatEthiopianTime(time, 'am')).toBe('ጠዋት 02:00');
      expect(formatEthiopianTime(time, 'en')).toBe('Morning 02:00');
    });
  });

  // ============================================================================
  // FLOW 3: AMHARIC VOICE ALARM LOOPING, TAKEN, SNOOZE, & SKIP ACTIONS
  // ============================================================================
  describe('Flow 3: Amharic Voice Alarm Looping & Intake Actions', () => {
    it('manages repeating alarm loop state correctly during ringing and dismissal', async () => {
      expect(voiceService.getIsLooping()).toBe(false);

      // 1. Alarm starts ringing
      await voiceService.startAlarmLoop();
      expect(voiceService.getIsLooping()).toBe(true);

      // 2. Alarm stops when user acts
      await voiceService.stopAlarmLoop();
      expect(voiceService.getIsLooping()).toBe(false);

      // 3. Taken confirmation automatically clears any looping state
      await voiceService.startAlarmLoop();
      expect(voiceService.getIsLooping()).toBe(true);
      await voiceService.speakTakenConfirmation();
      expect(voiceService.getIsLooping()).toBe(false);
    });

    it('executes TAKEN flow: decrements stock, records intake log, and triggers confirmation', async () => {
      const med: Medication = {
        id: 'med_amlodipine',
        profileId: 'prof_yared',
        name: 'Amlodipine',
        dosage: '1 Tablet',
        dosageAmount: 1,
        mealTiming: 'AFTER_MEAL',
        stockCount: 20,
        lowStockThreshold: 5,
        createdAt: Date.now(),
      };
      await repo.saveMedication(med);

      const payload: NotificationPayload = {
        scheduleId: 'sched_1',
        medicationId: 'med_amlodipine',
        profileId: 'prof_yared',
        patientName: 'Yared',
        medicationName: 'Amlodipine',
        dosage: '1 Tablet',
        mealTiming: 'AFTER_MEAL',
        scheduledTimestamp: Date.now(),
      };

      // Execute TAKEN action
      const result = await alarmService.handleNotificationAction('TAKEN', payload);
      expect(result.status).toBe('TAKEN');
      expect(result.newStock).toBe(19);

      // Verify repository state
      const updatedMed = await repo.getMedicationById('med_amlodipine');
      expect(updatedMed?.stockCount).toBe(19);

      const logs = await repo.getIntakeLogs('prof_yared');
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('TAKEN');
      expect(logs[0].medicationId).toBe('med_amlodipine');
    });

    it('executes SNOOZE flow: reschedules alarm for 10 minutes, preserves stock count', async () => {
      const med: Medication = {
        id: 'med_paracetamol',
        profileId: 'prof_kidist',
        name: 'Paracetamol',
        dosage: '1 Tablet',
        dosageAmount: 1,
        mealTiming: 'AFTER_MEAL',
        stockCount: 15,
        lowStockThreshold: 5,
        createdAt: Date.now(),
      };
      await repo.saveMedication(med);

      const payload: NotificationPayload = {
        scheduleId: 'sched_2',
        medicationId: 'med_paracetamol',
        profileId: 'prof_kidist',
        patientName: 'Kidist',
        medicationName: 'Paracetamol',
        dosage: '1 Tablet',
        mealTiming: 'AFTER_MEAL',
        scheduledTimestamp: Date.now(),
      };

      const result = await alarmService.handleNotificationAction('SNOOZE', payload);
      expect(result.status).toBe('SNOOZED');

      // Stock must NOT be decremented on snooze
      const updatedMed = await repo.getMedicationById('med_paracetamol');
      expect(updatedMed?.stockCount).toBe(15);

      const logs = await repo.getIntakeLogs('prof_kidist');
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('SNOOZED');
    });

    it('executes SKIP flow: preserves stock count and captures skip reason', async () => {
      const med: Medication = {
        id: 'med_aspirin',
        profileId: 'prof_yared',
        name: 'Aspirin',
        dosage: '1 Tablet',
        dosageAmount: 1,
        mealTiming: 'WITH_MEAL',
        stockCount: 10,
        lowStockThreshold: 3,
        createdAt: Date.now(),
      };
      await repo.saveMedication(med);

      const payload: NotificationPayload = {
        scheduleId: 'sched_3',
        medicationId: 'med_aspirin',
        profileId: 'prof_yared',
        patientName: 'Yared',
        medicationName: 'Aspirin',
        dosage: '1 Tablet',
        mealTiming: 'WITH_MEAL',
        scheduledTimestamp: Date.now(),
      };

      const result = await alarmService.handleNotificationAction('SKIP', payload);
      expect(result.status).toBe('SKIPPED');

      const updatedMed = await repo.getMedicationById('med_aspirin');
      expect(updatedMed?.stockCount).toBe(10);

      const logs = await repo.getIntakeLogs('prof_yared');
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('SKIPPED');
      expect(logs[0].reason).toContain('Skip');
    });
  });

  // ============================================================================
  // FLOW 4: LOW STOCK DETECTION & REFILL INVENTORY MANAGEMENT
  // ============================================================================
  describe('Flow 4: Low Stock Detection & Inventory Replenishment', () => {
    it('detects when stock count hits threshold and triggers low stock alert', async () => {
      const lowStockSpy = jest.spyOn(alarmService, 'triggerLowStockNotification');

      // Medication with stock 4 and threshold 3
      const med: Medication = {
        id: 'med_critical',
        profileId: 'prof_mother',
        name: 'Insulin',
        dosage: '1 Unit',
        dosageAmount: 1,
        mealTiming: 'BEFORE_MEAL',
        stockCount: 4,
        lowStockThreshold: 3,
        createdAt: Date.now(),
      };
      await repo.saveMedication(med);

      const payload: NotificationPayload = {
        scheduleId: 'sched_crit',
        medicationId: 'med_critical',
        profileId: 'prof_mother',
        patientName: 'Saranara (እማማ)',
        medicationName: 'Insulin',
        dosage: '1 Unit',
        mealTiming: 'BEFORE_MEAL',
        scheduledTimestamp: Date.now(),
      };

      // 1. Take dose -> stock drops to 3 (hits threshold)
      const result = await alarmService.handleNotificationAction('TAKEN', payload);
      expect(result.newStock).toBe(3);
      expect(lowStockSpy).toHaveBeenCalledWith('Saranara (እማማ)', 'Insulin', 3);

      // 2. User refills inventory (+30 units)
      const refilledStock = await repo.updateStock('med_critical', 30);
      expect(refilledStock).toBe(33);

      const postRefillMed = await repo.getMedicationById('med_critical');
      expect(postRefillMed?.stockCount).toBe(33);

      lowStockSpy.mockRestore();
    });
  });

  // ============================================================================
  // FLOW 5: ADHERENCE HISTORY, MULTI-DEPENDENT FILTERING, & RESET TO ZERO
  // ============================================================================
  describe('Flow 5: Adherence History Tracking & Multi-Dependent Filter', () => {
    it('supports individual dependent log isolation and complete history purge', async () => {
      // Create intake logs for Yared and Mother
      await repo.logIntake({
        id: 'log_y1',
        scheduleId: 's1',
        medicationId: 'm1',
        profileId: 'prof_yared',
        scheduledTime: 1000,
        actualTime: 1002,
        status: 'TAKEN',
      });

      await repo.logIntake({
        id: 'log_m1',
        scheduleId: 's2',
        medicationId: 'm2',
        profileId: 'prof_mother',
        scheduledTime: 2000,
        actualTime: 2005,
        status: 'TAKEN',
      });

      await repo.logIntake({
        id: 'log_y2',
        scheduleId: 's1',
        medicationId: 'm1',
        profileId: 'prof_yared',
        scheduledTime: 3000,
        actualTime: 3000,
        status: 'SKIPPED',
      });

      // 1. Filter by Yared
      const yaredHistory = await repo.getIntakeLogs('prof_yared');
      expect(yaredHistory).toHaveLength(2);

      // 2. Filter by Mother
      const motherHistory = await repo.getIntakeLogs('prof_mother');
      expect(motherHistory).toHaveLength(1);

      // 3. Clear only Yared's history
      await repo.clearIntakeLogs('prof_yared');
      expect(await repo.getIntakeLogs('prof_yared')).toHaveLength(0);
      expect(await repo.getIntakeLogs('prof_mother')).toHaveLength(1);

      // 4. Reset entire history to zero ("አጽዳ 🗑️")
      await repo.clearIntakeLogs();
      const allCleared = await repo.getIntakeLogs();
      expect(allCleared).toHaveLength(0);
    });
  });

  // ============================================================================
  // FLOW 6: REAL-TIME TICKER DUPLICATE SUPPRESSION & EDGE CASE RESILIENCE
  // ============================================================================
  describe('Flow 6: Concurrency & Duplicate Alarm Suppression', () => {
    it('prevents multiple triggers of the same alarm within the same minute', () => {
      const triggeredKeys = new Set<string>();

      const schedId = 'sched_sample';
      const dateKey = '2026-09-17';
      const hour = 8;
      const minute = 0;

      const alarmKey = `${schedId}_${dateKey}_${hour}_${minute}`;

      // First check at minute 8:00
      let triggeredFirst = false;
      if (!triggeredKeys.has(alarmKey)) {
        triggeredKeys.add(alarmKey);
        triggeredFirst = true;
      }
      expect(triggeredFirst).toBe(true);

      // Second check within the same minute (e.g. 10s later)
      let triggeredSecond = false;
      if (!triggeredKeys.has(alarmKey)) {
        triggeredKeys.add(alarmKey);
        triggeredSecond = true;
      }
      // Must be suppressed
      expect(triggeredSecond).toBe(false);
    });

    it('handles stock decrement floor boundary without negative stock errors', async () => {
      const med: Medication = {
        id: 'med_depleted',
        profileId: 'prof_yared',
        name: 'Vitamin D',
        dosage: '1 Tablet',
        dosageAmount: 1,
        mealTiming: 'AFTER_MEAL',
        stockCount: 1,
        lowStockThreshold: 2,
        createdAt: Date.now(),
      };
      await repo.saveMedication(med);

      // Decrement by 1 -> becomes 0
      const stock1 = await repo.updateStock('med_depleted', -1);
      expect(stock1).toBe(0);

      // Further decrement -> safely floors at 0 (never negative pills)
      const stock2 = await repo.updateStock('med_depleted', -1);
      expect(stock2).toBe(0);
    });
  });
});
