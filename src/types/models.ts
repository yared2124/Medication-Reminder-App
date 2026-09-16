import { EthiopianTime } from './ethiopianTime';

export interface Profile {
  id: string;
  name: string;
  avatarUrl?: string;
  color: string;
  relationship?: string; // e.g. "Self", "Mother", "Child", "እናት", "እኔ"
  age?: number;
  emergencyContact?: string;
  createdAt: number;
}

export type MealTiming = 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'ANYTIME';

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string; // e.g., "1 ኪኒን" / "1 tablet", "5ml"
  dosageAmount: number; // pill/unit count consumed per intake (default 1)
  mealTiming: MealTiming;
  stockCount: number;
  lowStockThreshold: number; // default: 3 days of doses
  instructions?: string;
  createdAt: number;
}

export type RecurrenceType = 'DAILY' | 'DAYS_OF_WEEK' | 'INTERVAL_HOURS';

export interface Schedule {
  id: string;
  medicationId: string;
  profileId: string;
  ethiopianTime: EthiopianTime;
  gregorianHour: number; // 0 - 23
  gregorianMinute: number; // 0 - 59
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  intervalHours?: number; // e.g., every 8 hours
  isActive: boolean;
  createdAt: number;
}

export type IntakeStatus = 'PENDING' | 'TAKEN' | 'SNOOZED' | 'SKIPPED' | 'MISSED';

export interface IntakeLog {
  id: string;
  scheduleId: string;
  medicationId: string;
  profileId: string;
  scheduledTime: number; // epoch timestamp
  actualTime?: number; // epoch timestamp when marked
  status: IntakeStatus;
  reason?: string; // optional note when skipped or missed
}

export interface NotificationPayload {
  scheduleId: string;
  medicationId: string;
  profileId: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  mealTiming: MealTiming;
  scheduledTimestamp: number;
}
