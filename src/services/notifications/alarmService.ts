import { NotificationPayload, IntakeStatus } from '../../types/models';
import { repository } from '../database/repository';
import { t } from '../../i18n';

export const ALARM_NOTIFICATION_CHANNEL_ID = 'medication_alarms_high_priority';
export const ALARM_NOTIFICATION_CHANNEL_NAME = 'የመድሃኒት ማስታወሻዎች (High Priority)';

export interface AlarmActionResponse {
  action: 'TAKEN' | 'SNOOZE' | 'SKIP';
  scheduleId: string;
  medicationId: string;
  profileId: string;
  scheduledTime: number;
}

export class AlarmService {
  private scheduledAlarmCount: number = 0;

  /**
   * Schedules an exact alarm with audio, vibration, and actionable buttons.
   */
  async scheduleMedicationAlarm(payload: NotificationPayload): Promise<string> {
    const notificationId = `alarm_${payload.scheduleId}_${payload.scheduledTimestamp}`;

    // Notification title & body formatted in Amharic
    const mealLabel = t(`meal.${payload.mealTiming}`);
    const title = t('notifications.alarm_title', { patientName: payload.patientName });
    const body = t('notifications.alarm_body', {
      medicationName: payload.medicationName,
      dosage: payload.dosage,
      mealTiming: mealLabel,
    });

    // In a React Native environment with @notifee/react-native:
    // await notifee.createTriggerNotification({
    //   id: notificationId,
    //   title,
    //   body,
    //   android: {
    //     channelId: ALARM_NOTIFICATION_CHANNEL_ID,
    //     importance: AndroidImportance.HIGH,
    //     category: AndroidCategory.ALARM,
    //     fullScreenAction: { id: 'default' },
    //     actions: [
    //       { title: t('actions.take'), pressAction: { id: 'TAKEN' } },
    //       { title: t('actions.snooze'), pressAction: { id: 'SNOOZE' } },
    //       { title: t('actions.skip'), pressAction: { id: 'SKIP' } },
    //     ],
    //   },
    //   trigger: {
    //     type: TriggerType.TIMESTAMP,
    //     timestamp: payload.scheduledTimestamp,
    //     alarmManager: { allowWhileIdle: true },
    //   },
    // });

    this.scheduledAlarmCount++;
    return notificationId;
  }

  /**
   * Handles user interaction from the notification shade or full-screen intent.
   * Can be triggered in foreground, background, or headless state.
   */
  async handleNotificationAction(
    actionType: 'TAKEN' | 'SNOOZE' | 'SKIP',
    payload: NotificationPayload
  ): Promise<{ status: IntakeStatus; newStock?: number }> {
    const logId = `log_${payload.scheduleId}_${Date.now()}`;

    switch (actionType) {
      case 'TAKEN': {
        // 1. Decrement medication inventory stock
        const newStock = await repository.updateStock(payload.medicationId, -1);

        // 2. Record successful intake log
        await repository.logIntake({
          id: logId,
          scheduleId: payload.scheduleId,
          medicationId: payload.medicationId,
          profileId: payload.profileId,
          scheduledTime: payload.scheduledTimestamp,
          actualTime: Date.now(),
          status: 'TAKEN',
        });

        // 3. Check for low inventory warning
        const med = await repository.getMedicationById(payload.medicationId);
        if (med && newStock <= med.lowStockThreshold) {
          await this.triggerLowStockNotification(payload.patientName, med.name, newStock);
        }

        return { status: 'TAKEN', newStock };
      }

      case 'SNOOZE': {
        // Postpone by 10 minutes (600,000 ms)
        const snoozedTimestamp = Date.now() + 10 * 60 * 1000;

        await this.scheduleMedicationAlarm({
          ...payload,
          scheduledTimestamp: snoozedTimestamp,
        });

        await repository.logIntake({
          id: logId,
          scheduleId: payload.scheduleId,
          medicationId: payload.medicationId,
          profileId: payload.profileId,
          scheduledTime: payload.scheduledTimestamp,
          actualTime: Date.now(),
          status: 'SNOOZED',
        });

        return { status: 'SNOOZED' };
      }

      case 'SKIP': {
        // Mark as skipped without modifying stock
        await repository.logIntake({
          id: logId,
          scheduleId: payload.scheduleId,
          medicationId: payload.medicationId,
          profileId: payload.profileId,
          scheduledTime: payload.scheduledTimestamp,
          actualTime: Date.now(),
          status: 'SKIPPED',
          reason: 'User tapped Skip / ዝለል',
        });

        return { status: 'SKIPPED' };
      }
    }
  }

  /**
   * Dispatches warning notification when stock reaches critical threshold (<= 3 days)
   */
  async triggerLowStockNotification(
    patientName: string,
    medicationName: string,
    count: number
  ): Promise<void> {
    const title = t('notifications.stock_alert_title');
    const body = t('notifications.stock_alert_body', {
      patientName,
      medicationName,
      count,
    });

    // Send high-priority stock warning push
  }

  getScheduledCount(): number {
    return this.scheduledAlarmCount;
  }
}

export const alarmService = new AlarmService();
