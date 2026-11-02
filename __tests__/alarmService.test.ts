import { AlarmService } from '../src/services/notifications/alarmService';
import { LocalMemoryRepository } from '../src/services/database/repository';
import { Medication, NotificationPayload, Profile } from '../src/types/models';

describe('AlarmService & Notification Action Engine', () => {
  let repo: LocalMemoryRepository;
  let alarmService: AlarmService;

  const mockProfile: Profile = {
    id: 'prof_1',
    name: 'ያሬድ',
    color: '#3B82F6',
    relationship: 'Self',
    createdAt: Date.now(),
  };

  const mockMed: Medication = {
    id: 'med_1',
    profileId: 'prof_1',
    name: 'ሜትፎርሚን',
    dosage: '1 ኪኒን',
    dosageAmount: 1,
    mealTiming: 'AFTER_MEAL',
    stockCount: 10,
    lowStockThreshold: 3,
    createdAt: Date.now(),
  };

  const mockPayload: NotificationPayload = {
    scheduleId: 'sched_1',
    medicationId: 'med_1',
    profileId: 'prof_1',
    patientName: 'ያሬድ',
    medicationName: 'ሜትፎርሚን',
    dosage: '1 ኪኒን',
    mealTiming: 'AFTER_MEAL',
    scheduledTimestamp: Date.now() + 60_000,
  };

  beforeEach(async () => {
    repo = new LocalMemoryRepository();
    alarmService = new AlarmService();
    // Swap singleton repo for testing
    const repositoryModule = require('../src/services/database/repository');
    repositoryModule.repository = repo;

    await repo.saveProfile(mockProfile);
    await repo.saveMedication(mockMed);
  });

  test('Schedule medication alarm tracks scheduled count', async () => {
    const id = await alarmService.scheduleMedicationAlarm(mockPayload);
    expect(id).toContain('sched_1');
    expect(alarmService.getScheduledCount()).toBe(1);
  });

  test('Action: TAKEN decrements medication inventory and creates TAKEN log', async () => {
    const initialMed = await repo.getMedicationById('med_1');
    expect(initialMed?.stockCount).toBe(10);

    const result = await alarmService.handleNotificationAction('TAKEN', mockPayload);
    expect(result.status).toBe('TAKEN');
    expect(result.newStock).toBe(9);

    const updatedMed = await repo.getMedicationById('med_1');
    expect(updatedMed?.stockCount).toBe(9);

    const logs = await repo.getIntakeLogs('prof_1');
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('TAKEN');
    expect(logs[0].scheduledTime).toBe(mockPayload.scheduledTimestamp);
  });

  test('Action: duplicate TAKEN events for one scheduled dose only decrement stock once', async () => {
    await alarmService.handleNotificationAction('TAKEN', mockPayload);
    await alarmService.handleNotificationAction('TAKEN', mockPayload);

    expect((await repo.getMedicationById('med_1'))?.stockCount).toBe(9);
    expect(await repo.getIntakeLogs('prof_1')).toHaveLength(1);
  });

  test('Action: TAKEN decrements the prescribed dosage quantity once', async () => {
    await repo.saveMedication({ ...mockMed, id: 'med_two', dosageAmount: 2, stockCount: 8 });
    await alarmService.handleNotificationAction('TAKEN', {
      ...mockPayload,
      medicationId: 'med_two',
    });

    expect((await repo.getMedicationById('med_two'))?.stockCount).toBe(6);
  });

  test('Action: SNOOZE schedules follow-up alarm and creates SNOOZED log', async () => {
    const result = await alarmService.handleNotificationAction('SNOOZE', mockPayload);
    expect(result.status).toBe('SNOOZED');

    // Stock must remain unchanged
    const med = await repo.getMedicationById('med_1');
    expect(med?.stockCount).toBe(10);

    const logs = await repo.getIntakeLogs('prof_1');
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('SNOOZED');
    expect(logs[0].scheduledTime).toBe(mockPayload.scheduledTimestamp);
    expect(alarmService.getScheduledCount()).toBe(1);
  });

  test('Action: SKIP leaves stock count unchanged and creates SKIPPED log', async () => {
    const result = await alarmService.handleNotificationAction('SKIP', mockPayload, 'Other reason');
    expect(result.status).toBe('SKIPPED');

    const med = await repo.getMedicationById('med_1');
    expect(med?.stockCount).toBe(10);

    const logs = await repo.getIntakeLogs('prof_1');
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('SKIPPED');
    expect(logs[0].reason).toBe('Other reason');
  });
});
