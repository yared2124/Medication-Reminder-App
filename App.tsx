import React, { useState, useEffect } from 'react';
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
import { THEME } from './src/constants/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const { addProfile, addMedicationWithSchedule, loadInitialData } = useAppStore();

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

  const handleOpenAlertTest = () => {
    setIsAlarmModalVisible(true);
    voiceService.speakReminder();
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

      {/* Mədin Full-Screen Notification Overlay */}
      <AlarmModal
        visible={isAlarmModalVisible}
        medicationName="Amlodipine"
        patientName="Yared"
        dosage="1 Tablet • ጠዋት 2:00"
        onTake={() => {
          setIsAlarmModalVisible(false);
          voiceService.speakTakenConfirmation();
        }}
        onSnooze={() => {
          setIsAlarmModalVisible(false);
        }}
        onDismiss={() => setIsAlarmModalVisible(false)}
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
