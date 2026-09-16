import { AppRegistry } from 'react-native';
import App from './App';
import { alarmService } from './src/services/notifications/alarmService';

// Name matching package.json / native application name
const appName = 'MedicationReminderApp';

// Background event handler for hardware notifications (fires even when app is terminated)
// With @notifee/react-native installed:
// notifee.onBackgroundEvent(async ({ type, detail }) => {
//   const { notification, pressAction } = detail;
//   if (type === EventType.ACTION_PRESS && pressAction?.id) {
//     const actionId = pressAction.id as 'TAKEN' | 'SNOOZE' | 'SKIP';
//     const payload = notification?.data as any;
//     if (payload) {
//       await alarmService.handleNotificationAction(actionId, payload);
//     }
//   }
// });

AppRegistry.registerComponent(appName, () => App);
