import { create } from 'zustand';
import { Profile, Medication, Schedule, IntakeLog } from '../types/models';
import { repository } from '../services/database/repository';
import { EthiopianTime } from '../types/ethiopianTime';
import {
  convertEthiopianToGregorianTime,
  getGregorianDateFromEthiopian,
} from '../utils/ethiopianTime';
import { alarmService } from '../services/notifications/alarmService';
import { preferenceStore } from '../services/preferences';

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
  ) => Promise<{ medication: Medication; schedule: Schedule; scheduleError?: string }>;
  deleteMedication: (id: string) => Promise<void>;
  updateStock: (medicationId: string, delta: number) => Promise<void>;

  logIntake: (
    scheduleId: string,
    medicationId: string,
    profileId: string,
    status: 'TAKEN' | 'SNOOZED' | 'SKIPPED',
    reason?: string,
    scheduledTime?: number
  ) => Promise<void>;
  clearHistory: (profileId?: string) => Promise<void>;
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
      const savedProfileId = preferenceStore.getActiveProfileId();
      const activeProfileId = profiles.some((profile) => profile.id === savedProfileId)
        ? savedProfileId
        : profiles[0]?.id ?? null;

      set({
        profiles,
        medications,
        schedules,
        logs,
        activeProfileId,
        isLoading: false,
      });
      preferenceStore.setActiveProfileId(activeProfileId);
      try {
        await alarmService.initialize();
        await alarmService.syncActiveSchedules(schedules, medications, profiles);
      } catch (error) {
        console.error('Failed to synchronize medication reminders:', error);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      set({ isLoading: false });
    }
  },

  setActiveProfileId: (id: string | null) => {
    preferenceStore.setActiveProfileId(id);
    set({ activeProfileId: id });
  },

  addProfile: async (profileData) => {
    const newProfile: Profile = {
      ...profileData,
      id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    await repository.saveProfile(newProfile);
    const shouldSelectNewProfile = !get().activeProfileId;
    if (shouldSelectNewProfile) preferenceStore.setActiveProfileId(newProfile.id);
    set((state) => ({
      profiles: [...state.profiles, newProfile],
      activeProfileId: state.activeProfileId || newProfile.id,
    }));
    return newProfile;
  },

  deleteProfile: async (id: string) => {
    const schedulesToDelete = get().schedules.filter((schedule) => schedule.profileId === id);
    await Promise.all(schedulesToDelete.map((schedule) => alarmService.cancelScheduleAlarms(schedule.id)));
    await repository.deleteProfile(id);
    const nextProfiles = get().profiles.filter((profile) => profile.id !== id);
    const nextActiveProfileId = nextProfiles[0]?.id ?? null;
    preferenceStore.setActiveProfileId(nextActiveProfileId);
    set((state) => {
      return {
        profiles: nextProfiles,
        activeProfileId: nextActiveProfileId,
        medications: state.medications.filter((m) => m.profileId !== id),
        schedules: state.schedules.filter((s) => s.profileId !== id),
        logs: state.logs.filter((log) => log.profileId !== id),
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

    try {
      const state = get();
      await alarmService.syncActiveSchedules(state.schedules, state.medications, state.profiles);
    } catch (error) {
      const scheduleError = error instanceof Error ? error.message : String(error);
      console.error(`Medication ${newMed.id} was saved, but its reminder was not scheduled:`, error);
      return { medication: newMed, schedule: newSchedule, scheduleError };
    }

    return { medication: newMed, schedule: newSchedule };
  },

  deleteMedication: async (id: string) => {
    const schedulesToDelete = get().schedules.filter((schedule) => schedule.medicationId === id);
    await Promise.all(schedulesToDelete.map((schedule) => alarmService.cancelScheduleAlarms(schedule.id)));
    await repository.deleteMedication(id);
    set((state) => ({
      medications: state.medications.filter((m) => m.id !== id),
      schedules: state.schedules.filter((s) => s.medicationId !== id),
      logs: state.logs.filter((log) => log.medicationId !== id),
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

  logIntake: async (scheduleId, medicationId, profileId, status, reason, scheduledTime) => {
    const medication = await repository.getMedicationById(medicationId);
    const profile = await repository.getProfileById(profileId);
    const schedule = get().schedules.find((item) => item.id === scheduleId);
    if (!medication || !profile || !schedule) {
      throw new Error(`Cannot process intake for schedule ${scheduleId}: medication or profile is missing`);
    }

    let doseTime = scheduledTime;
    if (doseTime === undefined) {
      const occurrence = getGregorianDateFromEthiopian(schedule.ethiopianTime, new Date());
      doseTime = occurrence.getTime();
    }

    const payload = {
      scheduleId,
      medicationId,
      profileId,
      patientName: profile.name,
      medicationName: medication.name,
      dosage: medication.dosage,
      mealTiming: medication.mealTiming,
      scheduledTimestamp: doseTime,
    };
    const action = status === 'TAKEN' ? 'TAKEN' : status === 'SNOOZED' ? 'SNOOZE' : 'SKIP';
    const result = await alarmService.handleNotificationAction(action, payload, reason);
    const intakeLog = await repository.getIntakeLogById(`log_${scheduleId}_${doseTime}`);
    if (!intakeLog) throw new Error(`Intake action completed without a log for schedule ${scheduleId}`);
    const newStock = result.newStock;

    set((state) => ({
      logs: [intakeLog, ...state.logs.filter((log) => log.id !== intakeLog.id)]
        .sort((a, b) => b.scheduledTime - a.scheduledTime),
      medications: newStock === undefined
        ? state.medications
        : state.medications.map((item) =>
          item.id === medicationId ? { ...item, stockCount: newStock } : item
        ),
    }));
  },

  clearHistory: async (profileId?: string) => {
    await repository.clearIntakeLogs(profileId);
    set((state) => ({
      logs: profileId ? state.logs.filter((l) => l.profileId !== profileId) : [],
    }));
  },
}));
