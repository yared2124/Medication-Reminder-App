import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { AddMedicationScreen } from './src/screens/medication/AddMedicationScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'ADD_MEDICATION'>(
    'DASHBOARD'
  );

  const { profiles, addProfile, loadInitialData } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      await loadInitialData();
      // If first launch, seed default demo profiles for immediate experience
      const currentProfiles = useAppStore.getState().profiles;
      if (currentProfiles.length === 0) {
        await addProfile({
          name: 'ያሬድ (እኔ)',
          color: '#2563EB',
          relationship: 'Self',
          age: 34,
        });
        await addProfile({
          name: 'እማማ',
          color: '#EC4899',
          relationship: 'Mother',
          age: 62,
        });
      }
    };
    initialize();
  }, [loadInitialData, addProfile]);

  return (
    <View style={styles.container}>
      {currentScreen === 'DASHBOARD' ? (
        <DashboardScreen
          onNavigateToAddMedication={() => setCurrentScreen('ADD_MEDICATION')}
          onNavigateToProfiles={() => {}}
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
