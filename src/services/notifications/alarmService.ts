import type { Notification, Trigger } from '@notifee/react-native';
import { Platform } from 'react-native';
import { IntakeLog, IntakeStatus, Medication, NotificationPayload, Profile, Schedule } from '../../types/models';
import * as Repository from '../database/repository';
import { IAppRepository } from '../database/repository';
import { getNextDailyOccurrenceTimestamp } from '../../utils/ethiopianTime';

export const ALARM_NOTIFICATION_CHANNEL_ID = 'medication_alarms_high_priority';
export const ALARM_NOTIFICATION_CHANNEL_NAME = 'የመድሃኒት ማስታወሻዎች (High Priority)';
export const TAKEN_ACTION_ID = 'TAKEN';
export const SNOOZE_ACTION_ID = 'SNOOZE';
export const SKIP_ACTION_ID = 'SKIP';

type NotifeeModule = typeof import('@notifee/react-native');

export interface AlarmActionResponse {
  action: 'TAKEN' | 'SNOOZE' | 'SKIP';
  scheduleId: string;
  medicationId: string;
  profileId: string;
  scheduledTime: number;
}

export class AlarmService {
  private scheduledAlarmCount = 0;
  private nativeNotifications: NotifeeModule | null = null;
  private alarmPermissionSettingsOpened = false;

  constructor(
    private readonly repo?: IAppRepository,
    private readonly notifications?: NotifeeModule,
    private readonly nativeEnabled = false
  ) {}

  private get repository(): IAppRepository {
    return this.repo ?? Repository.repository;
  }

  private async notificationModule(): Promise<NotifeeModule | null> {
    if (this.notifications) return this.notifications;
    if (!this.nativeEnabled) return null;
    this.nativeNotifications ??= await import('@notifee/react-native');
    return this.nativeNotifications;
  }

  async initialize(): Promise<void> {
    const notifications = await this.notificationModule();
    if (!notifications) return;

    const permission = await notifications.default.requestPermission();
    if (permission.authorizationStatus === notifications.AuthorizationStatus.DENIED) {
      throw new Error('Notification permission is required for medication reminders');
    }
    await notifications.default.createChannel({
      id: ALARM_NOTIFICATION_CHANNEL_ID,
      name: ALARM_NOTIFICATION_CHANNEL_NAME,
      importance: notifications.AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
    });
  }

  async scheduleMedicationAlarm(payload: NotificationPayload): Promise<string> {
    const triggerTimestamp = payload.triggerTimestamp ?? payload.scheduledTimestamp;
    if (triggerTimestamp <= Date.now()) {
      throw new Error('Medication alarm trigger must be in the future');
    }

    const notificationPrefix = payload.triggerTimestamp === undefined ? 'alarm' : 'snooze';
    const notificationId = `${notificationPrefix}_${payload.scheduleId}_${triggerTimestamp}`;
    const notifications = await this.notificationModule();
    if (notifications) {
      const { AlarmType, TriggerType } = notifications;
      const trigger: Trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTimestamp,
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
          allowWhileIdle: true,
        },
      };
      await notifications.default.createTriggerNotification(
        {
          id: notificationId,
          title: `${payload.medicationName} • ${payload.patientName}`,
          body: `${payload.dosage} is due now.`,
          data: this.serializePayload(payload),
          android: {
            channelId: ALARM_NOTIFICATION_CHANNEL_ID,
            category: notifications.AndroidCategory.ALARM,
            importance: notifications.AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            actions: [
              { title: 'Taken', pressAction: { id: TAKEN_ACTION_ID } },
              { title: 'Snooze 10 min', pressAction: { id: SNOOZE_ACTION_ID } },
              { title: 'Skip', pressAction: { id: SKIP_ACTION_ID } },
            ],
          },
        },
        trigger
      );
    }

    this.scheduledAlarmCount++;
    return notificationId;
  }

  async cancelScheduleAlarms(scheduleId: string): Promise<void> {
    const notifications = await this.notificationModule();
    if (!notifications) return;

    const triggers = await notifications.default.getTriggerNotifications();
    const schedulePrefix = `alarm_${scheduleId}_`;
    const snoozePrefix = `snooze_${scheduleId}_`;
    await Promise.all(
      triggers
        .filter(({ notification }) =>
          notification.id?.startsWith(schedulePrefix) || notification.id?.startsWith(snoozePrefix)
        )
        .map(({ notification }) => notification.id
          ? notifications.default.cancelTriggerNotification(notification.id)
          : Promise.resolve())
    );
  }

  async syncActiveSchedules(
    schedules: Schedule[],
    medications: Medication[],
    profiles: Profile[]
  ): Promise<void> {
    const notifications = await this.notificationModule();
    const activeSchedules = schedules.filter((item) => item.isActive);
    if (notifications && activeSchedules.length > 0) {
      const settings = await notifications.default.getNotificationSettings();
      if (settings.authorizationStatus === notifications.AuthorizationStatus.DENIED) {
        throw new Error('Notification permission is required for medication reminders');
      }
      if (
        Platform.OS === 'android'
        && settings.android.alarm === notifications.AndroidNotificationSetting.DISABLED
      ) {
        if (!this.alarmPermissionSettingsOpened) {
          this.alarmPermissionSettingsOpened = true;
          await notifications.default.openAlarmPermissionSettings();
        }
        throw new Error('Allow exact alarms in Android settings, then return to the app');
      }
    }

    if (notifications) {
      const triggers = await notifications.default.getTriggerNotifications();
      await Promise.all(
        triggers
          .filter(({ notification }) => notification.id?.startsWith('alarm_'))
          .map(({ notification }) => notification.id
            ? notifications.default.cancelTriggerNotification(notification.id)
            : Promise.resolve())
      );
    }

    for (const schedule of activeSchedules) {
      const medication = medications.find((item) => item.id === schedule.medicationId);
      const profile = profiles.find((item) => item.id === schedule.profileId);
      if (!medication || !profile) {
        throw new Error(`Cannot schedule reminder ${schedule.id}: medication or profile is missing`);
      }
      await this.scheduleUpcomingOccurrence(schedule, medication, profile);
    }
  }

  async scheduleNextOccurrence(scheduleId: string): Promise<void> {
    const schedule = (await this.repository.getActiveSchedules())
      .find((item) => item.id === scheduleId);
    if (!schedule) return;

    const medication = await this.repository.getMedicationById(schedule.medicationId);
    const profile = await this.repository.getProfileById(schedule.profileId);
    if (!medication || !profile) {
      throw new Error(`Cannot schedule reminder ${scheduleId}: medication or profile is missing`);
    }
    await this.scheduleUpcomingOccurrence(schedule, medication, profile);
  }

  private async scheduleUpcomingOccurrence(
    schedule: Schedule,
    medication: Medication,
    profile: Profile
  ): Promise<void> {
    await this.scheduleMedicationAlarm({
      scheduleId: schedule.id,
      medicationId: medication.id,
      profileId: profile.id,
      patientName: profile.name,
      medicationName: medication.name,
      dosage: medication.dosage,
      mealTiming: medication.mealTiming,
      scheduledTimestamp: this.nextScheduleTimestamp(schedule, new Date()),
    });
  }

  private nextScheduleTimestamp(schedule: Schedule, now: Date): number {
    if (schedule.recurrenceType === 'DAILY') {
      return getNextDailyOccurrenceTimestamp(
        { hour: schedule.ethiopianTime.hour, minute: schedule.ethiopianTime.minute, period: schedule.ethiopianTime.period },
        now
      );
    }

    if (schedule.recurrenceType === 'DAYS_OF_WEEK') {
      if (!schedule.daysOfWeek?.length) {
        throw new Error(`Schedule ${schedule.id} has no recurrence days`);
      }
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const occurrence = new Date(now);
        occurrence.setDate(occurrence.getDate() + dayOffset);
        occurrence.setHours(schedule.gregorianHour, schedule.gregorianMinute, 0, 0);
        if (occurrence.getTime() > now.getTime() && schedule.daysOfWeek.includes(occurrence.getDay())) {
          return occurrence.getTime();
        }
      }
      throw new Error(`Could not calculate next occurrence for schedule ${schedule.id}`);
    }

    const intervalHours = schedule.intervalHours;
    if (!intervalHours || intervalHours <= 0) {
      throw new Error(`Schedule ${schedule.id} has an invalid interval`);
    }
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const firstOccurrence = new Date(schedule.createdAt);
    firstOccurrence.setHours(schedule.gregorianHour, schedule.gregorianMinute, 0, 0);
    if (firstOccurrence.getTime() < schedule.createdAt) {
      firstOccurrence.setTime(firstOccurrence.getTime() + intervalMs);
    }
    if (firstOccurrence.getTime() > now.getTime()) return firstOccurrence.getTime();
    return firstOccurrence.getTime()
      + (Math.floor((now.getTime() - firstOccurrence.getTime()) / intervalMs) + 1) * intervalMs;
  }

  async handleNotificationAction(
    actionType: 'TAKEN' | 'SNOOZE' | 'SKIP',
    payload: NotificationPayload,
    reason?: string
  ): Promise<{ status: IntakeStatus; newStock?: number }> {
    const log: IntakeLog = {
      id: this.intakeLogId(payload),
      scheduleId: payload.scheduleId,
      medicationId: payload.medicationId,
      profileId: payload.profileId,
      scheduledTime: payload.scheduledTimestamp,
      actualTime: Date.now(),
      status: actionType === 'TAKEN' ? 'TAKEN' : actionType === 'SNOOZE' ? 'SNOOZED' : 'SKIPPED',
    };

    const previousLog = await this.repository.getIntakeLogById(log.id);
    if (previousLog?.status === 'TAKEN' || previousLog?.status === 'SKIPPED') {
      const medication = previousLog.status === 'TAKEN'
        ? await this.repository.getMedicationById(payload.medicationId)
        : null;
      return {
        status: previousLog.status,
        newStock: medication?.stockCount,
      };
    }

    if (actionType === 'TAKEN') {
      const recorded = await this.repository.recordTakenIntake(log);
      const medication = await this.repository.getMedicationById(payload.medicationId);
      if (recorded.wasRecorded && medication && recorded.newStock <= medication.lowStockThreshold) {
        await this.triggerLowStockNotification(payload.patientName, medication.name, recorded.newStock);
      }
      await this.cancelCurrentNotification(payload);
      await this.cancelScheduleAlarms(payload.scheduleId);
      await this.scheduleNextOccurrence(payload.scheduleId);
      return { status: 'TAKEN', newStock: recorded.newStock };
    }

    if (actionType === 'SNOOZE') {
      await this.repository.logIntake({ ...log, status: 'SNOOZED' });
      await this.scheduleMedicationAlarm({
        ...payload,
        triggerTimestamp: Date.now() + 10 * 60 * 1000,
      });
      await this.cancelCurrentNotification(payload);
      await this.scheduleNextOccurrence(payload.scheduleId);
      return { status: 'SNOOZED' };
    }

    await this.repository.logIntake({
      ...log,
      status: 'SKIPPED',
      reason: reason?.trim() || 'User tapped Skip',
    });
    await this.cancelCurrentNotification(payload);
    await this.cancelScheduleAlarms(payload.scheduleId);
    await this.scheduleNextOccurrence(payload.scheduleId);
    return { status: 'SKIPPED' };
  }

  async triggerLowStockNotification(
    _patientName: string,
    _medicationName: string,
    _count: number
  ): Promise<void> {
    // Low stock warning notification is handled separately from scheduled dose reminders.
  }

  getScheduledCount(): number {
    return this.scheduledAlarmCount;
  }

  private intakeLogId(payload: NotificationPayload): string {
    return `log_${payload.scheduleId}_${payload.scheduledTimestamp}`;
  }

  private async cancelCurrentNotification(payload: NotificationPayload): Promise<void> {
    const notifications = await this.notificationModule();
    if (!notifications) return;
    const notificationId = payload.triggerTimestamp === undefined
      ? `alarm_${payload.scheduleId}_${payload.scheduledTimestamp}`
      : `snooze_${payload.scheduleId}_${payload.triggerTimestamp}`;
    await notifications.default.cancelNotification(notificationId);
  }

  private serializePayload(payload: NotificationPayload): Record<string, string> {
    return Object.fromEntries(
      Object.entries(payload)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    );
  }

  static deserializePayload(data: Notification['data'] | undefined): NotificationPayload | null {
    if (!data) return null;
    const required = [
      'scheduleId',
      'medicationId',
      'profileId',
      'patientName',
      'medicationName',
      'dosage',
      'mealTiming',
      'scheduledTimestamp',
    ] as const;
    if (required.some((key) => data[key] === undefined || data[key] === null)) return null;
    const scheduledTimestamp = Number(data.scheduledTimestamp);
    if (!Number.isFinite(scheduledTimestamp)) return null;

    return {
      scheduleId: String(data.scheduleId),
      medicationId: String(data.medicationId),
      profileId: String(data.profileId),
      patientName: String(data.patientName),
      medicationName: String(data.medicationName),
      dosage: String(data.dosage),
      mealTiming: String(data.mealTiming) as NotificationPayload['mealTiming'],
      scheduledTimestamp,
      triggerTimestamp: data.triggerTimestamp === undefined
        ? undefined
        : Number(data.triggerTimestamp),
    };
  }
}

export const alarmService = new AlarmService(undefined, undefined, true);
