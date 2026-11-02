import type { SQLiteDatabase } from 'expo-sqlite';
import {
  Profile,
  Medication,
  Schedule,
  IntakeLog,
  IntakeStatus,
} from '../../types/models';
import { CREATE_TABLES_SQL } from './schema';

export interface IAppRepository {
  getProfiles(): Promise<Profile[]>;
  getProfileById(id: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  deleteProfile(id: string): Promise<void>;
  getMedications(profileId?: string): Promise<Medication[]>;
  getMedicationById(id: string): Promise<Medication | null>;
  saveMedication(medication: Medication): Promise<void>;
  updateStock(medicationId: string, delta: number): Promise<number>;
  deleteMedication(id: string): Promise<void>;
  getSchedules(profileId?: string): Promise<Schedule[]>;
  getActiveSchedules(): Promise<Schedule[]>;
  saveSchedule(schedule: Schedule): Promise<void>;
  deleteSchedule(id: string): Promise<void>;
  getIntakeLogs(profileId?: string, limit?: number): Promise<IntakeLog[]>;
  getIntakeLogById(id: string): Promise<IntakeLog | null>;
  logIntake(log: IntakeLog): Promise<void>;
  recordTakenIntake(log: IntakeLog): Promise<{ newStock: number; wasRecorded: boolean }>;
  updateIntakeStatus(logId: string, status: IntakeStatus, reason?: string): Promise<void>;
  clearIntakeLogs(profileId?: string): Promise<void>;
}

interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string;
  relationship: string | null;
  age: number | null;
  emergency_contact: string | null;
  created_at: number;
}

interface MedicationRow {
  id: string;
  profile_id: string;
  name: string;
  dosage: string;
  dosage_amount: number;
  meal_timing: Medication['mealTiming'];
  stock_count: number;
  low_stock_threshold: number;
  instructions: string | null;
  created_at: number;
}

interface ScheduleRow {
  id: string;
  medication_id: string;
  profile_id: string;
  ethiopian_hour: number;
  ethiopian_minute: number;
  diurnal_period: Schedule['ethiopianTime']['period'];
  gregorian_hour: number;
  gregorian_minute: number;
  recurrence_type: Schedule['recurrenceType'];
  days_of_week: string | null;
  interval_hours: number | null;
  is_active: number;
  created_at: number;
}

interface IntakeLogRow {
  id: string;
  schedule_id: string;
  medication_id: string;
  profile_id: string;
  scheduled_time: number;
  actual_time: number | null;
  status: IntakeStatus;
  reason: string | null;
}

const profileFromRow = (row: ProfileRow): Profile => ({
  id: row.id,
  name: row.name,
  avatarUrl: row.avatar_url ?? undefined,
  color: row.color,
  relationship: row.relationship ?? undefined,
  age: row.age ?? undefined,
  emergencyContact: row.emergency_contact ?? undefined,
  createdAt: row.created_at,
});

const medicationFromRow = (row: MedicationRow): Medication => ({
  id: row.id,
  profileId: row.profile_id,
  name: row.name,
  dosage: row.dosage,
  dosageAmount: row.dosage_amount,
  mealTiming: row.meal_timing,
  stockCount: row.stock_count,
  lowStockThreshold: row.low_stock_threshold,
  instructions: row.instructions ?? undefined,
  createdAt: row.created_at,
});

const scheduleFromRow = (row: ScheduleRow): Schedule => ({
  id: row.id,
  medicationId: row.medication_id,
  profileId: row.profile_id,
  ethiopianTime: {
    hour: row.ethiopian_hour,
    minute: row.ethiopian_minute,
    period: row.diurnal_period,
  },
  gregorianHour: row.gregorian_hour,
  gregorianMinute: row.gregorian_minute,
  recurrenceType: row.recurrence_type,
  daysOfWeek: row.days_of_week ? JSON.parse(row.days_of_week) as number[] : undefined,
  intervalHours: row.interval_hours ?? undefined,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
});

const intakeLogFromRow = (row: IntakeLogRow): IntakeLog => ({
  id: row.id,
  scheduleId: row.schedule_id,
  medicationId: row.medication_id,
  profileId: row.profile_id,
  scheduledTime: row.scheduled_time,
  actualTime: row.actual_time ?? undefined,
  status: row.status,
  reason: row.reason ?? undefined,
});

const profileValues = (profile: Profile) => [
  profile.id, profile.name, profile.avatarUrl ?? null, profile.color,
  profile.relationship ?? null, profile.age ?? null, profile.emergencyContact ?? null,
  profile.createdAt,
];

const medicationValues = (medication: Medication) => [
  medication.id, medication.profileId, medication.name, medication.dosage,
  medication.dosageAmount, medication.mealTiming, medication.stockCount,
  medication.lowStockThreshold, medication.instructions ?? null, medication.createdAt,
];

const scheduleValues = (schedule: Schedule) => [
  schedule.id, schedule.medicationId, schedule.profileId,
  schedule.ethiopianTime.hour, schedule.ethiopianTime.minute,
  schedule.ethiopianTime.period, schedule.gregorianHour, schedule.gregorianMinute,
  schedule.recurrenceType, schedule.daysOfWeek ? JSON.stringify(schedule.daysOfWeek) : null,
  schedule.intervalHours ?? null, schedule.isActive ? 1 : 0, schedule.createdAt,
];

const intakeLogValues = (log: IntakeLog) => [
  log.id, log.scheduleId, log.medicationId, log.profileId, log.scheduledTime,
  log.actualTime ?? null, log.status, log.reason ?? null,
];

const SAVE_INTAKE_SQL = `
  INSERT INTO intake_logs (id, schedule_id, medication_id, profile_id, scheduled_time, actual_time, status, reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    actual_time = excluded.actual_time,
    status = excluded.status,
    reason = excluded.reason
`;

export class SQLiteRepository implements IAppRepository {
  private databasePromise: Promise<SQLiteDatabase> | null = null;

  private async database(): Promise<SQLiteDatabase> {
    if (!this.databasePromise) {
      const opening = import('expo-sqlite').then(async (SQLite) => {
        const database = await SQLite.openDatabaseAsync('medication-reminder.db');
        await database.execAsync('PRAGMA foreign_keys = ON;');
        await database.execAsync(CREATE_TABLES_SQL);
        return database;
      });
      this.databasePromise = opening.catch((error: unknown) => {
        this.databasePromise = null;
        throw error;
      });
    }

    return this.databasePromise;
  }

  async getProfiles(): Promise<Profile[]> {
    const db = await this.database();
    const rows = await db.getAllAsync<ProfileRow>('SELECT * FROM profiles ORDER BY created_at');
    return rows.map(profileFromRow);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const db = await this.database();
    const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', id);
    return row ? profileFromRow(row) : null;
  }

  async saveProfile(profile: Profile): Promise<void> {
    const db = await this.database();
    await db.runAsync(
      `INSERT INTO profiles
       (id, name, avatar_url, color, relationship, age, emergency_contact, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, avatar_url = excluded.avatar_url, color = excluded.color,
         relationship = excluded.relationship, age = excluded.age,
         emergency_contact = excluded.emergency_contact, created_at = excluded.created_at`,
      profileValues(profile)
    );
  }

  async deleteProfile(id: string): Promise<void> {
    const db = await this.database();
    await db.runAsync('DELETE FROM profiles WHERE id = ?', id);
  }

  async getMedications(profileId?: string): Promise<Medication[]> {
    const db = await this.database();
    const rows = profileId
      ? await db.getAllAsync<MedicationRow>('SELECT * FROM medications WHERE profile_id = ?', profileId)
      : await db.getAllAsync<MedicationRow>('SELECT * FROM medications');
    return rows.map(medicationFromRow);
  }

  async getMedicationById(id: string): Promise<Medication | null> {
    const db = await this.database();
    const row = await db.getFirstAsync<MedicationRow>('SELECT * FROM medications WHERE id = ?', id);
    return row ? medicationFromRow(row) : null;
  }

  async saveMedication(medication: Medication): Promise<void> {
    const db = await this.database();
    await db.runAsync(
      `INSERT INTO medications
       (id, profile_id, name, dosage, dosage_amount, meal_timing, stock_count, low_stock_threshold, instructions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         profile_id = excluded.profile_id, name = excluded.name, dosage = excluded.dosage,
         dosage_amount = excluded.dosage_amount, meal_timing = excluded.meal_timing,
         stock_count = excluded.stock_count, low_stock_threshold = excluded.low_stock_threshold,
         instructions = excluded.instructions, created_at = excluded.created_at`,
      medicationValues(medication)
    );
  }

  async updateStock(medicationId: string, delta: number): Promise<number> {
    const db = await this.database();
    const result = await db.runAsync(
      'UPDATE medications SET stock_count = MAX(0, stock_count + ?) WHERE id = ?',
      delta,
      medicationId
    );
    if (result.changes === 0) throw new Error(`Medication not found: ${medicationId}`);
    const medication = await this.getMedicationById(medicationId);
    if (!medication) throw new Error(`Medication not found after stock update: ${medicationId}`);
    return medication.stockCount;
  }

  async deleteMedication(id: string): Promise<void> {
    const db = await this.database();
    await db.runAsync('DELETE FROM medications WHERE id = ?', id);
  }

  async getSchedules(profileId?: string): Promise<Schedule[]> {
    const db = await this.database();
    const rows = profileId
      ? await db.getAllAsync<ScheduleRow>('SELECT * FROM schedules WHERE profile_id = ?', profileId)
      : await db.getAllAsync<ScheduleRow>('SELECT * FROM schedules');
    return rows.map(scheduleFromRow);
  }

  async getActiveSchedules(): Promise<Schedule[]> {
    const db = await this.database();
    const rows = await db.getAllAsync<ScheduleRow>('SELECT * FROM schedules WHERE is_active = 1');
    return rows.map(scheduleFromRow);
  }

  async saveSchedule(schedule: Schedule): Promise<void> {
    const db = await this.database();
    await db.runAsync(
      `INSERT INTO schedules
       (id, medication_id, profile_id, ethiopian_hour, ethiopian_minute, diurnal_period,
        gregorian_hour, gregorian_minute, recurrence_type, days_of_week, interval_hours, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         medication_id = excluded.medication_id, profile_id = excluded.profile_id,
         ethiopian_hour = excluded.ethiopian_hour, ethiopian_minute = excluded.ethiopian_minute,
         diurnal_period = excluded.diurnal_period, gregorian_hour = excluded.gregorian_hour,
         gregorian_minute = excluded.gregorian_minute, recurrence_type = excluded.recurrence_type,
         days_of_week = excluded.days_of_week, interval_hours = excluded.interval_hours,
         is_active = excluded.is_active, created_at = excluded.created_at`,
      scheduleValues(schedule)
    );
  }

  async deleteSchedule(id: string): Promise<void> {
    const db = await this.database();
    await db.runAsync('DELETE FROM schedules WHERE id = ?', id);
  }

  async getIntakeLogs(profileId?: string, limit = 50): Promise<IntakeLog[]> {
    const db = await this.database();
    const rows = profileId
      ? await db.getAllAsync<IntakeLogRow>(
        'SELECT * FROM intake_logs WHERE profile_id = ? ORDER BY scheduled_time DESC LIMIT ?',
        profileId,
        limit
      )
      : await db.getAllAsync<IntakeLogRow>(
        'SELECT * FROM intake_logs ORDER BY scheduled_time DESC LIMIT ?',
        limit
      );
    return rows.map(intakeLogFromRow);
  }

  async getIntakeLogById(id: string): Promise<IntakeLog | null> {
    const db = await this.database();
    const row = await db.getFirstAsync<IntakeLogRow>('SELECT * FROM intake_logs WHERE id = ?', id);
    return row ? intakeLogFromRow(row) : null;
  }

  async logIntake(log: IntakeLog): Promise<void> {
    const db = await this.database();
    await db.runAsync(SAVE_INTAKE_SQL, intakeLogValues(log));
  }

  async recordTakenIntake(log: IntakeLog): Promise<{ newStock: number; wasRecorded: boolean }> {
    const db = await this.database();
    let result: { newStock: number; wasRecorded: boolean } | null = null;

    await db.withExclusiveTransactionAsync(async (transaction) => {
      const previous = await transaction.getFirstAsync<IntakeLogRow>(
        'SELECT * FROM intake_logs WHERE id = ?',
        log.id
      );

      if (previous?.status === 'TAKEN') {
        const medication = await transaction.getFirstAsync<{ stock_count: number }>(
          'SELECT stock_count FROM medications WHERE id = ?',
          log.medicationId
        );
        if (!medication) throw new Error(`Medication not found: ${log.medicationId}`);
        result = { newStock: medication.stock_count, wasRecorded: false };
        return;
      }

      const update = await transaction.runAsync(
        'UPDATE medications SET stock_count = MAX(0, stock_count - dosage_amount) WHERE id = ?',
        log.medicationId
      );
      if (update.changes === 0) throw new Error(`Medication not found: ${log.medicationId}`);
      const medication = await transaction.getFirstAsync<{ stock_count: number }>(
        'SELECT stock_count FROM medications WHERE id = ?',
        log.medicationId
      );
      if (!medication) throw new Error(`Medication not found after stock update: ${log.medicationId}`);
      await transaction.runAsync(SAVE_INTAKE_SQL, intakeLogValues(log));
      result = { newStock: medication.stock_count, wasRecorded: true };
    });

    if (!result) throw new Error('Could not record medication intake');
    return result;
  }

  async updateIntakeStatus(logId: string, status: IntakeStatus, reason?: string): Promise<void> {
    const db = await this.database();
    const result = await db.runAsync(
      'UPDATE intake_logs SET status = ?, actual_time = ?, reason = ? WHERE id = ?',
      status,
      Date.now(),
      reason ?? null,
      logId
    );
    if (result.changes === 0) throw new Error(`Intake log not found: ${logId}`);
  }

  async clearIntakeLogs(profileId?: string): Promise<void> {
    const db = await this.database();
    if (profileId) {
      await db.runAsync('DELETE FROM intake_logs WHERE profile_id = ?', profileId);
    } else {
      await db.runAsync('DELETE FROM intake_logs');
    }
  }
}

export class LocalMemoryRepository implements IAppRepository {
  private profiles = new Map<string, Profile>();
  private medications = new Map<string, Medication>();
  private schedules = new Map<string, Schedule>();
  private logs = new Map<string, IntakeLog>();

  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).sort((a, b) => a.createdAt - b.createdAt);
  }
  async getProfileById(id: string): Promise<Profile | null> {
    return this.profiles.get(id) ?? null;
  }
  async saveProfile(profile: Profile): Promise<void> {
    this.profiles.set(profile.id, { ...profile });
  }
  async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
    for (const medication of Array.from(this.medications.values())) {
      if (medication.profileId === id) await this.deleteMedication(medication.id);
    }
    for (const [logId, log] of this.logs) {
      if (log.profileId === id) this.logs.delete(logId);
    }
  }
  async getMedications(profileId?: string): Promise<Medication[]> {
    const list = Array.from(this.medications.values());
    return profileId ? list.filter((medication) => medication.profileId === profileId) : list;
  }
  async getMedicationById(id: string): Promise<Medication | null> {
    return this.medications.get(id) ?? null;
  }
  async saveMedication(medication: Medication): Promise<void> {
    this.medications.set(medication.id, { ...medication });
  }
  async updateStock(medicationId: string, delta: number): Promise<number> {
    const medication = this.medications.get(medicationId);
    if (!medication) throw new Error(`Medication not found: ${medicationId}`);
    medication.stockCount = Math.max(0, medication.stockCount + delta);
    return medication.stockCount;
  }
  async deleteMedication(id: string): Promise<void> {
    this.medications.delete(id);
    for (const [scheduleId, schedule] of this.schedules) {
      if (schedule.medicationId === id) this.schedules.delete(scheduleId);
    }
    for (const [logId, log] of this.logs) {
      if (log.medicationId === id) this.logs.delete(logId);
    }
  }
  async getSchedules(profileId?: string): Promise<Schedule[]> {
    const list = Array.from(this.schedules.values());
    return profileId ? list.filter((schedule) => schedule.profileId === profileId) : list;
  }
  async getActiveSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter((schedule) => schedule.isActive);
  }
  async saveSchedule(schedule: Schedule): Promise<void> {
    this.schedules.set(schedule.id, { ...schedule });
  }
  async deleteSchedule(id: string): Promise<void> {
    this.schedules.delete(id);
  }
  async getIntakeLogs(profileId?: string, limit = 50): Promise<IntakeLog[]> {
    const logs = Array.from(this.logs.values())
      .filter((log) => !profileId || log.profileId === profileId)
      .sort((a, b) => b.scheduledTime - a.scheduledTime);
    return logs.slice(0, limit);
  }
  async getIntakeLogById(id: string): Promise<IntakeLog | null> {
    return this.logs.get(id) ?? null;
  }
  async logIntake(log: IntakeLog): Promise<void> {
    this.logs.set(log.id, { ...log });
  }
  async recordTakenIntake(log: IntakeLog): Promise<{ newStock: number; wasRecorded: boolean }> {
    const existing = this.logs.get(log.id);
    const medication = this.medications.get(log.medicationId);
    if (!medication) throw new Error(`Medication not found: ${log.medicationId}`);
    if (existing?.status === 'TAKEN') {
      return { newStock: medication.stockCount, wasRecorded: false };
    }
    medication.stockCount = Math.max(0, medication.stockCount - medication.dosageAmount);
    this.logs.set(log.id, { ...log });
    return { newStock: medication.stockCount, wasRecorded: true };
  }
  async updateIntakeStatus(logId: string, status: IntakeStatus, reason?: string): Promise<void> {
    const log = this.logs.get(logId);
    if (!log) throw new Error(`Intake log not found: ${logId}`);
    this.logs.set(logId, { ...log, status, actualTime: Date.now(), reason });
  }
  async clearIntakeLogs(profileId?: string): Promise<void> {
    if (!profileId) {
      this.logs.clear();
      return;
    }
    for (const [id, log] of this.logs) {
      if (log.profileId === profileId) this.logs.delete(id);
    }
  }
}

export const repository: IAppRepository = new SQLiteRepository();
