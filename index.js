const notifee = require('@notifee/react-native').default;
const { EventType } = require('@notifee/react-native');
const {
  AlarmService,
  alarmService,
  TAKEN_ACTION_ID,
  SNOOZE_ACTION_ID,
  SKIP_ACTION_ID,
} = require('./src/services/notifications/alarmService');

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const notification = detail.notification;
  const payload = AlarmService.deserializePayload(notification && notification.data);
  if (!payload) {
    if (type === EventType.DELIVERED) {
      throw new Error('Delivered medication notification did not include a valid payload');
    }
    return;
  }

  if (type === EventType.DELIVERED) {
    await alarmService.scheduleNextOccurrence(payload.scheduleId);
    return;
  }
  if (type !== EventType.ACTION_PRESS) return;

  const actionId = detail.pressAction && detail.pressAction.id;
  const action = actionId === TAKEN_ACTION_ID
    ? 'TAKEN'
    : actionId === SNOOZE_ACTION_ID
      ? 'SNOOZE'
      : actionId === SKIP_ACTION_ID
        ? 'SKIP'
        : null;
  if (!action) return;

  await alarmService.handleNotificationAction(
    action,
    payload,
    action === 'SKIP' ? 'User skipped this dose from the notification' : undefined
  );
  if (notification && notification.id) {
    await notifee.cancelNotification(notification.id);
  }
});

const { registerRootComponent } = require('expo');
const App = require('./App').default;

registerRootComponent(App);
