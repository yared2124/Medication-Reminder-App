import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
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
  } | null>(null);

  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  const {
    profiles,
    medications,
    schedules,
    addProfile,
    addMedicationWithSchedule,
    loadInitialData,
    logIntake,
    updateStock,
  } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      await loadInitialData();

      const state = useAppStore.getState();

      // Migrate any existing #2563EB profile colors to brand coral
      state.profiles.forEach((p) => {
        if (p.color === '#2563EB') {
          p.color = THEME.colors.coral;
        }
      });

      // Seed initial patients from the Mədin design mockup if empty
      if (state.profiles.length === 0) {
        const yared = await addProfile({
          name: 'Yared',
          color: THEME.colors.coral,
          relationship: 'Self',
          age: 32,
        });

        const kidist = await addProfile({
          name: 'Kidist',
          color: THEME.colors.teal,
          relationship: 'Daughter',
          age: 12,
        });

        const saranara = await addProfile({
          name: 'Saranara (እማማ)',
          color: '#EC4899',
          relationship: 'Mother',
          age: 64,
        });

        // 1. Amlodipine for Yared (ጠዋት 2:00)
        await addMedicationWithSchedule(
          {
            profileId: yared.id,
            name: 'Amlodipine',
            dosage: '1 Tablet',
            dosageAmount: 1,
            mealTiming: 'AFTER_MEAL',
            stockCount: 24,
            lowStockThreshold: 6,
          },
          { hour: 2, minute: 0, period: 'TEWAT' } // 02:00 ጠዋት (8:00 AM)
        );

        // 2. Paracetamol for Kidist (ከሰዓት 8:30)
        await addMedicationWithSchedule(
          {
            profileId: kidist.id,
            name: 'Paracetamol',
            dosage: '1 Tablet',
            dosageAmount: 1,
            mealTiming: 'AFTER_MEAL',
            stockCount: 16,
            lowStockThreshold: 6,
          },
          { hour: 8, minute: 30, period: 'KESEAT' } // 08:30 ከሰዓት (2:30 PM)
        );

        // 3. Metformin for Mother (ጠዋት 2:00)
        await addMedicationWithSchedule(
          {
            profileId: saranara.id,
            name: 'Metformin',
            dosage: '1 Tablet',
            dosageAmount: 1,
            mealTiming: 'WITH_MEAL',
            stockCount: 5, // Low stock demo!
            lowStockThreshold: 6,
          },
          { hour: 2, minute: 0, period: 'TEWAT' }
        );

        useAppStore.getState().setActiveProfileId(null);
      }
    };

    initialize();
  }, [loadInitialData, addProfile, addMedicationWithSchedule]);

  // Real-time alarm ticker: monitors schedules every 10 seconds and triggers the
  // Amharic repeating voice alarm when the scheduled clock time arrives.
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      for (const sched of schedules) {
        if (sched.isActive === false) continue;

        if (sched.gregorianHour === currentHour && sched.gregorianMinute === currentMinute) {
          const alarmKey = `${sched.id}_${todayKey}_${currentHour}_${currentMinute}`;
          if (!triggeredAlarmsRef.current.has(alarmKey)) {
            triggeredAlarmsRef.current.add(alarmKey);

            const med = medications.find((m) => m.id === sched.medicationId);
            const prof = profiles.find((p) => p.id === sched.profileId);

            setActiveAlarm({
              scheduleId: sched.id,
              medicationId: sched.medicationId,
              profileId: sched.profileId,
              medicationName: med?.name || 'Medication',
              patientName: prof?.name || 'Patient',
              dosage: `${med?.dosage || '1 Tablet'} • ${formatEthiopianTime(sched.ethiopianTime)}`,
            });
            setIsAlarmModalVisible(true);
            break;
          }
        }
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 10000);
    return () => clearInterval(interval);
  }, [schedules, medications, profiles]);

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
    });
    setIsAlarmModalVisible(true);
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
        onTake={async () => {
          if (activeAlarm) {
            await logIntake(
              activeAlarm.scheduleId,
              activeAlarm.medicationId,
              activeAlarm.profileId,
              'TAKEN'
            );
            await updateStock(activeAlarm.medicationId, -1);
          }
          setIsAlarmModalVisible(false);
          setActiveAlarm(null);
          voiceService.speakTakenConfirmation();
        }}
        onSnooze={async () => {
          if (activeAlarm) {
            await logIntake(
              activeAlarm.scheduleId,
              activeAlarm.medicationId,
              activeAlarm.profileId,
              'SNOOZED'
            );
          }
          setIsAlarmModalVisible(false);
          setActiveAlarm(null);
        }}
        onDismiss={() => {
          setIsAlarmModalVisible(false);
          setActiveAlarm(null);
        }}
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
