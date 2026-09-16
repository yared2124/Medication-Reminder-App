import { LocalMemoryRepository } from '../src/services/database/repository';
import { IntakeLog } from '../src/types/models';

describe('Intake Log Management and History Reset', () => {
  let repo: LocalMemoryRepository;

  beforeEach(() => {
    repo = new LocalMemoryRepository();
  });

  it('correctly filters logs by profileId when multiple dependents exist', async () => {
    const log1: IntakeLog = {
      id: 'log_1',
      scheduleId: 'sched_1',
      medicationId: 'med_1',
      profileId: 'samuel_id',
      scheduledTime: 1000,
      actualTime: 1005,
      status: 'TAKEN',
    };

    const log2: IntakeLog = {
      id: 'log_2',
      scheduleId: 'sched_2',
      medicationId: 'med_2',
      profileId: 'yared_id',
      scheduledTime: 2000,
      actualTime: 2010,
      status: 'TAKEN',
    };

    const log3: IntakeLog = {
      id: 'log_3',
      scheduleId: 'sched_3',
      medicationId: 'med_1',
      profileId: 'samuel_id',
      scheduledTime: 3000,
      actualTime: 3000,
      status: 'SKIPPED',
    };

    await repo.logIntake(log1);
    await repo.logIntake(log2);
    await repo.logIntake(log3);

    // Filter by Samuel
    const samuelLogs = await repo.getIntakeLogs('samuel_id');
    expect(samuelLogs).toHaveLength(2);
    expect(samuelLogs.map((l) => l.id)).toEqual(['log_3', 'log_1']);

    // Filter by Yared
    const yaredLogs = await repo.getIntakeLogs('yared_id');
    expect(yaredLogs).toHaveLength(1);
    expect(yaredLogs[0].id).toBe('log_2');

    // All logs
    const allLogs = await repo.getIntakeLogs();
    expect(allLogs).toHaveLength(3);
  });

  it('clears intake logs for a specific profile without deleting others', async () => {
    await repo.logIntake({
      id: 'l1',
      scheduleId: 's1',
      medicationId: 'm1',
      profileId: 'samuel_id',
      scheduledTime: 100,
      status: 'TAKEN',
    });

    await repo.logIntake({
      id: 'l2',
      scheduleId: 's2',
      medicationId: 'm2',
      profileId: 'yared_id',
      scheduledTime: 200,
      status: 'TAKEN',
    });

    // Clear only Samuel's history
    await repo.clearIntakeLogs('samuel_id');

    const samuelLogs = await repo.getIntakeLogs('samuel_id');
    expect(samuelLogs).toHaveLength(0);

    const yaredLogs = await repo.getIntakeLogs('yared_id');
    expect(yaredLogs).toHaveLength(1);

    const totalLogs = await repo.getIntakeLogs();
    expect(totalLogs).toHaveLength(1);
  });

  it('resets all history to zero when clearIntakeLogs is called without profileId', async () => {
    await repo.logIntake({
      id: 'l1',
      scheduleId: 's1',
      medicationId: 'm1',
      profileId: 'samuel_id',
      scheduledTime: 100,
      status: 'TAKEN',
    });

    await repo.logIntake({
      id: 'l2',
      scheduleId: 's2',
      medicationId: 'm2',
      profileId: 'yared_id',
      scheduledTime: 200,
      status: 'TAKEN',
    });

    // Reset all history to zero
    await repo.clearIntakeLogs();

    const allLogs = await repo.getIntakeLogs();
    expect(allLogs).toHaveLength(0);
  });
});
