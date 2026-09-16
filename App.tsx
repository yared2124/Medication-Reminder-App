import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { AddMedicationScreen } from './src/screens/medication/AddMedicationScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'ADD_MEDICATION'>(
    'DASHBOARD'
  );

  const { addProfile, addMedicationWithSchedule, loadInitialData } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      await loadInitialData();

      const state = useAppStore.getState();

      // If first launch, seed default demo profiles & sample medications
      if (state.profiles.length === 0) {
        const yaredProfile = await addProfile({
          name: 'ያሬድ (እኔ)',
          color: '#2563EB',
          relationship: 'Self',
          age: 34,
        });

        const motherProfile = await addProfile({
          name: 'እማማ',
          color: '#EC4899',
          relationship: 'Mother',
          age: 62,
        });

        // Seed sample schedule for Mother (Blood Pressure)
        await addMedicationWithSchedule(
          {
            profileId: motherProfile.id,
            name: 'አምሎዲፒን (የደም ግፊት)',
            dosage: '1 ኪኒን',
            dosageAmount: 1,
            mealTiming: 'AFTER_MEAL',
            stockCount: 18,
            lowStockThreshold: 6,
          },
          { hour: 2, minute: 30, period: 'TEWAT' } // 02:30 ጠዋት (8:30 AM)
        );

        // Seed sample schedule for Yared
        await addMedicationWithSchedule(
          {
            profileId: yaredProfile.id,
            name: 'ቫይታሚን ዲ (Vitamin D)',
            dosage: '1 ኪኒን',
            dosageAmount: 1,
            mealTiming: 'WITH_MEAL',
            stockCount: 25,
            lowStockThreshold: 6,
          },
          { hour: 2, minute: 0, period: 'TEWAT' } // 02:00 ጠዋት (8:00 AM)
        );

        // Set active profile to "All" (null) so all cards show immediately
        useAppStore.getState().setActiveProfileId(null);
      } else if (state.medications.length === 0 && state.profiles.length > 0) {
        // In case profiles existed but no medications were added yet
        const firstProfile = state.profiles[0];
        await addMedicationWithSchedule(
          {
            profileId: firstProfile.id,
            name: 'አምሎዲፒን (የደም ግፊት)',
            dosage: '1 ኪኒን',
            dosageAmount: 1,
            mealTiming: 'AFTER_MEAL',
            stockCount: 18,
            lowStockThreshold: 6,
          },
          { hour: 2, minute: 30, period: 'TEWAT' }
        );
        useAppStore.getState().setActiveProfileId(null);
      }
    };

    initialize();
  }, [loadInitialData, addProfile, addMedicationWithSchedule]);

  return (
    <View style={styles.container}>
      {currentScreen === 'DASHBOARD' ? (
        <DashboardScreen
          onNavigateToAddMedication={() => setCurrentScreen('ADD_MEDICATION')}
        />
      ) : (
        <AddMedicationScreen
          onBack={() => setCurrentScreen('DASHBOARD')}
          onSuccess={() => setCurrentScreen('DASHBOARD')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
