import {
  Profile,
  Medication,
  Schedule,
  IntakeLog,
  IntakeStatus,
} from '../../types/models';

export interface IAppRepository {
  // Profile CRUD
  getProfiles(): Promise<Profile[]>;
  getProfileById(id: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  deleteProfile(id: string): Promise<void>;

  // Medication CRUD
  getMedications(profileId?: string): Promise<Medication[]>;
  getMedicationById(id: string): Promise<Medication | null>;
  saveMedication(medication: Medication): Promise<void>;
  updateStock(medicationId: string, delta: number): Promise<number>; // returns new stock
  deleteMedication(id: string): Promise<void>;

  // Schedule CRUD
  getSchedules(profileId?: string): Promise<Schedule[]>;
  getActiveSchedules(): Promise<Schedule[]>;
  saveSchedule(schedule: Schedule): Promise<void>;
  deleteSchedule(id: string): Promise<void>;

  // Intake Logs CRUD
  getIntakeLogs(profileId?: string, limit?: number): Promise<IntakeLog[]>;
  logIntake(log: IntakeLog): Promise<void>;
  updateIntakeStatus(logId: string, status: IntakeStatus, reason?: string): Promise<void>;
  clearIntakeLogs(profileId?: string): Promise<void>;
}

/**
 * Fast, robust local in-memory & SQLite-compatible repository.
 * Provides high-speed reactive persistence and instant testability.
 */
export class LocalMemoryRepository implements IAppRepository {
  private profiles: Map<string, Profile> = new Map();
  private medications: Map<string, Medication> = new Map();
  private schedules: Map<string, Schedule> = new Map();
  private logs: Map<string, IntakeLog> = new Map();

  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    return this.profiles.get(id) || null;
  }

  async saveProfile(profile: Profile): Promise<void> {
    this.profiles.set(profile.id, { ...profile });
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
    // Cascade delete medications & schedules
    for (const [medId, med] of this.medications.entries()) {
      if (med.profileId === id) {
        await this.deleteMedication(medId);
      }
    }
  }

  async getMedications(profileId?: string): Promise<Medication[]> {
    const list = Array.from(this.medications.values());
    if (profileId) {
      return list.filter((m) => m.profileId === profileId);
    }
    return list;
  }

  async getMedicationById(id: string): Promise<Medication | null> {
    return this.medications.get(id) || null;
  }

  async saveMedication(medication: Medication): Promise<void> {
    this.medications.set(medication.id, { ...medication });
  }

  async updateStock(medicationId: string, delta: number): Promise<number> {
    const med = this.medications.get(medicationId);
    if (!med) throw new Error(`Medication not found: ${medicationId}`);
    const newStock = Math.max(0, med.stockCount + delta);
    med.stockCount = newStock;
    this.medications.set(medicationId, { ...med });
    return newStock;
  }

  async deleteMedication(id: string): Promise<void> {
    this.medications.delete(id);
    for (const [sId, s] of this.schedules.entries()) {
      if (s.medicationId === id) {
        this.schedules.delete(sId);
      }
    }
  }

  async getSchedules(profileId?: string): Promise<Schedule[]> {
    const list = Array.from(this.schedules.values());
    if (profileId) {
      return list.filter((s) => s.profileId === profileId);
    }
    return list;
  }

  async getActiveSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter((s) => s.isActive);
  }

  async saveSchedule(schedule: Schedule): Promise<void> {
    this.schedules.set(schedule.id, { ...schedule });
  }

  async deleteSchedule(id: string): Promise<void> {
    this.schedules.delete(id);
  }

  async getIntakeLogs(profileId?: string, limit: number = 50): Promise<IntakeLog[]> {
    let list = Array.from(this.logs.values()).sort(
      (a, b) => b.scheduledTime - a.scheduledTime
    );
    if (profileId) {
      list = list.filter((l) => l.profileId === profileId);
    }
    return list.slice(0, limit);
  }

  async logIntake(log: IntakeLog): Promise<void> {
    this.logs.set(log.id, { ...log });
  }

  async updateIntakeStatus(
    logId: string,
    status: IntakeStatus,
    reason?: string
  ): Promise<void> {
    const item = this.logs.get(logId);
    if (item) {
      item.status = status;
      item.actualTime = Date.now();
      if (reason) item.reason = reason;
      this.logs.set(logId, { ...item });
    }
  }

  async clearIntakeLogs(profileId?: string): Promise<void> {
    if (profileId) {
      for (const [id, log] of this.logs.entries()) {
        if (log.profileId === profileId) {
          this.logs.delete(id);
        }
      }
    } else {
      this.logs.clear();
    }
  }
}

export const repository: IAppRepository = new LocalMemoryRepository();
