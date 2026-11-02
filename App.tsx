import React, { useState, useEffect } from 'react';
import { Alert, AppState, View, StyleSheet } from 'react-native';
import notifee, { EventType, Notification } from '@notifee/react-native';
import { useAppStore } from './src/store/useAppStore';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { AddMedicationScreen } from './src/screens/medication/AddMedicationScreen';
import { HistoryScreen } from './src/screens/history/HistoryScreen';
import { ProfilesScreen } from './src/screens/profiles/ProfilesScreen';
import { BottomTabBar, TabType } from './src/components/navigation/BottomTabBar';
import { SideMenuDrawer } from './src/components/navigation/SideMenuDrawer';
import { AlarmModal } from './src/components/notifications/AlarmModal';
import { voiceService } from './src/services/audio/voiceService';
import { formatEthiopianTime } from './src/utils/ethiopianTime';
import {
  AlarmService,
  alarmService,
  SNOOZE_ACTION_ID,
  SKIP_ACTION_ID,
  TAKEN_ACTION_ID,
} from './src/services/notifications/alarmService';
import { THEME } from './src/constants/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{
    scheduleId: string;
    medicationId: string;
    profileId: string;
    medicationName: string;
    patientName: string;
    dosage: string;
    scheduledTimestamp: number;
  } | null>(null);

  const {
    profiles,
    medications,
    schedules,
    loadInitialData,
    logIntake,
  } = useAppStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    let appWasInactive = false;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        appWasInactive = true;
      } else if (appWasInactive) {
        appWasInactive = false;
        void loadInitialData();
      }
    });
    return () => subscription.remove();
  }, [loadInitialData]);

  useEffect(() => {
    const showNotification = (data: Notification['data'] | undefined) => {
      const payload = AlarmService.deserializePayload(data);
      if (!payload) return;
      setActiveAlarm({
        scheduleId: payload.scheduleId,
        medicationId: payload.medicationId,
        profileId: payload.profileId,
        medicationName: payload.medicationName,
        patientName: payload.patientName,
        dosage: payload.dosage,
        scheduledTimestamp: payload.scheduledTimestamp,
      });
      setIsAlarmModalVisible(true);
    };

    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      const notification = detail.notification;
      if (!notification) return;
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        showNotification(notification.data);
        if (type === EventType.DELIVERED) {
          const payload = AlarmService.deserializePayload(notification.data);
          if (payload) await alarmService.scheduleNextOccurrence(payload.scheduleId);
        }
        return;
      }
      if (type !== EventType.ACTION_PRESS) return;

      const payload = AlarmService.deserializePayload(notification.data);
      if (!payload) return;
      const actionId = detail.pressAction?.id;
      const status = actionId === TAKEN_ACTION_ID
        ? 'TAKEN'
        : actionId === SNOOZE_ACTION_ID
          ? 'SNOOZED'
          : actionId === SKIP_ACTION_ID
            ? 'SKIPPED'
            : null;
      if (!status) return;
      try {
        await logIntake(
          payload.scheduleId,
          payload.medicationId,
          payload.profileId,
          status,
          status === 'SKIPPED' ? 'User skipped this dose' : undefined,
          payload.scheduledTimestamp
        );
      } catch (error) {
        console.error(`Failed to record ${status.toLowerCase()} medication action:`, error);
        Alert.alert(
          'Could not save medication action',
          error instanceof Error ? error.message : 'Please try again.'
        );
        return;
      }
      setIsAlarmModalVisible(false);
      setActiveAlarm(null);
      voiceService.stopAlarmLoop();
      if (status === 'TAKEN') voiceService.speakTakenConfirmation();
    });
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification?.notification.data) {
        showNotification(initialNotification.notification.data);
      }
    }).catch((error: unknown) => {
      console.error('Failed to load the notification that opened the app:', error);
    });
    return unsubscribe;
  }, [logIntake]);

  const handleOpenAlertTest = () => {
    const firstSched = schedules[0];
    const med = firstSched ? medications.find((m) => m.id === firstSched.medicationId) : null;
    const prof = firstSched ? profiles.find((p) => p.id === firstSched.profileId) : null;

    setActiveAlarm({
      scheduleId: firstSched?.id || 'demo_sched',
      medicationId: med?.id || 'demo_med',
      profileId: prof?.id || 'demo_prof',
      medicationName: med?.name || 'Amlodipine',
      patientName: prof?.name || 'Yared',
      dosage: firstSched
        ? `${med?.dosage || '1 Tablet'} • ${formatEthiopianTime(firstSched.ethiopianTime)}`
        : '1 Tablet • ጠዋት 2:00',
      scheduledTimestamp: Date.now(),
    });
    setIsAlarmModalVisible(true);
  };

  const handleAlarmAction = async (
    status: 'TAKEN' | 'SNOOZED' | 'SKIPPED',
    reason?: string
  ) => {
    if (!activeAlarm) return;
    try {
      await logIntake(
        activeAlarm.scheduleId,
        activeAlarm.medicationId,
        activeAlarm.profileId,
        status,
        reason,
        activeAlarm.scheduledTimestamp
      );
    } catch (error) {
      console.error(`Failed to record ${status.toLowerCase()} medication action:`, error);
      Alert.alert(
        'Could not save medication action',
        error instanceof Error ? error.message : 'Please try again.'
      );
      return;
    }

    setIsAlarmModalVisible(false);
    setActiveAlarm(null);
    if (status === 'TAKEN') voiceService.speakTakenConfirmation();
  };

  const renderActiveTabScreen = () => {
    switch (activeTab) {
      case 'HOME':
        return (
          <DashboardScreen
            onNavigateToAddMedication={() => setIsAddingMedication(true)}
            onOpenNotifications={handleOpenAlertTest}
            onOpenMenu={() => setIsSideMenuOpen(true)}
          />
        );
      case 'HISTORY':
        return <HistoryScreen />;
      case 'PROFILES':
        return <ProfilesScreen />;
      case 'ALERTS':
        // Trigger voice alert and show full-screen modal
        return (
          <DashboardScreen
            onNavigateToAddMedication={() => setIsAddingMedication(true)}
            onOpenNotifications={handleOpenAlertTest}
            onOpenMenu={() => setIsSideMenuOpen(true)}
          />
        );
      default:
        return (
          <DashboardScreen
            onNavigateToAddMedication={() => setIsAddingMedication(true)}
            onOpenNotifications={handleOpenAlertTest}
            onOpenMenu={() => setIsSideMenuOpen(true)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {isAddingMedication ? (
        <AddMedicationScreen
          onBack={() => setIsAddingMedication(false)}
          onSuccess={() => setIsAddingMedication(false)}
        />
      ) : (
        <>
          <View style={styles.screenWrapper}>{renderActiveTabScreen()}</View>

          {/* Mədin Bottom Navigation Bar with Floating Teal FAB (+) */}
          <BottomTabBar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (tab === 'ALERTS') {
                handleOpenAlertTest();
              } else {
                setActiveTab(tab);
              }
            }}
            onPressAdd={() => setIsAddingMedication(true)}
          />
        </>
      )}

      {/* Mədin Full-Screen Notification Overlay with continuous looping Amharic alarm */}
      <AlarmModal
        visible={isAlarmModalVisible}
        medicationName={activeAlarm?.medicationName || 'Amlodipine'}
        patientName={activeAlarm?.patientName || 'Yared'}
        dosage={activeAlarm?.dosage || '1 Tablet • ጠዋት 2:00'}
        onTake={() => handleAlarmAction('TAKEN')}
        onSnooze={() => handleAlarmAction('SNOOZED')}
        onDismiss={() => {
          setIsAlarmModalVisible(false);
          setActiveAlarm(null);
        }}
        onSkip={(reason) => handleAlarmAction('SKIPPED', reason)}
      />

      {/* Side Navigation Drawer for ☰ */}
      <SideMenuDrawer
        visible={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onNavigate={(screen) => {
          if (screen === 'ADD_MEDICATION') {
            setIsAddingMedication(true);
          } else {
            setActiveTab(screen);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  screenWrapper: {
    flex: 1,
  },
});
