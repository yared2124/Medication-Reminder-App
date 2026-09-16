import { create } from 'zustand';
import { Profile, Medication, Schedule, IntakeLog } from '../types/models';
import { repository } from '../services/database/repository';
import { EthiopianTime } from '../types/ethiopianTime';
import { convertEthiopianToGregorianTime } from '../utils/ethiopianTime';

interface AppState {
  // Profiles
  profiles: Profile[];
  activeProfileId: string | null; // null represents "All Dependents"
  isLoading: boolean;

  // Medications & Schedules
  medications: Medication[];
  schedules: Schedule[];
  logs: IntakeLog[];

  // Actions
  loadInitialData: () => Promise<void>;
  setActiveProfileId: (id: string | null) => void;
  addProfile: (profile: Omit<Profile, 'id' | 'createdAt'>) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<void>;

  addMedicationWithSchedule: (
    medication: Omit<Medication, 'id' | 'createdAt'>,
    ethiopianTime: EthiopianTime
  ) => Promise<{ medication: Medication; schedule: Schedule }>;
  deleteMedication: (id: string) => Promise<void>;
  updateStock: (medicationId: string, delta: number) => Promise<void>;

  logIntake: (
    scheduleId: string,
    medicationId: string,
    profileId: string,
    status: 'TAKEN' | 'SNOOZED' | 'SKIPPED',
    reason?: string
  ) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  isLoading: false,
  medications: [],
  schedules: [],
  logs: [],

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const profiles = await repository.getProfiles();
      const medications = await repository.getMedications();
      const schedules = await repository.getSchedules();
      const logs = await repository.getIntakeLogs();

      set({
        profiles,
        medications,
        schedules,
        logs,
        activeProfileId: profiles.length > 0 ? profiles[0].id : null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      set({ isLoading: false });
    }
  },

  setActiveProfileId: (id: string | null) => {
    set({ activeProfileId: id });
  },

  addProfile: async (profileData) => {
    const newProfile: Profile = {
      ...profileData,
      id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    await repository.saveProfile(newProfile);
    set((state) => ({
      profiles: [...state.profiles, newProfile],
      activeProfileId: state.activeProfileId || newProfile.id,
    }));
    return newProfile;
  },

  deleteProfile: async (id: string) => {
    await repository.deleteProfile(id);
    set((state) => {
      const remaining = state.profiles.filter((p) => p.id !== id);
      return {
        profiles: remaining,
        activeProfileId: remaining.length > 0 ? remaining[0].id : null,
        medications: state.medications.filter((m) => m.profileId !== id),
        schedules: state.schedules.filter((s) => s.profileId !== id),
      };
    });
  },

  addMedicationWithSchedule: async (medData, ethiopianTime) => {
    const medId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMed: Medication = {
      ...medData,
      id: medId,
      createdAt: Date.now(),
    };

    const greg = convertEthiopianToGregorianTime(ethiopianTime);
    const schedId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSchedule: Schedule = {
      id: schedId,
      medicationId: medId,
      profileId: medData.profileId,
      ethiopianTime,
      gregorianHour: greg.hour,
      gregorianMinute: greg.minute,
      recurrenceType: 'DAILY',
      isActive: true,
      createdAt: Date.now(),
    };

    await repository.saveMedication(newMed);
    await repository.saveSchedule(newSchedule);

    set((state) => ({
      medications: [...state.medications, newMed],
      schedules: [...state.schedules, newSchedule],
    }));

    return { medication: newMed, schedule: newSchedule };
  },

  deleteMedication: async (id: string) => {
    await repository.deleteMedication(id);
    set((state) => ({
      medications: state.medications.filter((m) => m.id !== id),
      schedules: state.schedules.filter((s) => s.medicationId !== id),
    }));
  },

  updateStock: async (medicationId: string, delta: number) => {
    const newStock = await repository.updateStock(medicationId, delta);
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === medicationId ? { ...m, stockCount: newStock } : m
      ),
    }));
  },

  logIntake: async (scheduleId, medicationId, profileId, status, reason) => {
    const log: IntakeLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      scheduleId,
      medicationId,
      profileId,
      scheduledTime: Date.now(),
      actualTime: Date.now(),
      status,
      reason,
    };

    await repository.logIntake(log);

    if (status === 'TAKEN') {
      await get().updateStock(medicationId, -1);
    }

    set((state) => ({
      logs: [log, ...state.logs],
    }));
  },
}));
