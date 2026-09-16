import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { ProfileSwitcher } from '../../components/dependent/ProfileSwitcher';
import { MedicationCard } from '../../components/medication/MedicationCard';
import { AddProfileModal } from '../../components/dependent/AddProfileModal';
import { RefillStockModal } from '../../components/medication/RefillStockModal';
import { Medication } from '../../types/models';
import { triggerSelectionHaptic } from '../../utils/haptics';
import { t } from '../../i18n';

interface DashboardScreenProps {
  onNavigateToAddMedication: () => void;
  onNavigateToProfiles?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToAddMedication,
}) => {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    medications,
    schedules,
    loadInitialData,
    addProfile,
    logIntake,
    updateStock,
  } = useAppStore();

  const [isAddProfileModalVisible, setIsAddProfileModalVisible] = useState(false);
  const [selectedMedForRefill, setSelectedMedForRefill] = useState<Medication | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter medications and schedules by active profile
  const filteredMeds = activeProfileId
    ? medications.filter((m) => m.profileId === activeProfileId)
    : medications;

  const getScheduleForMed = (medId: string) => {
    return schedules.find((s) => s.medicationId === medId);
  };

  const handleTake = (medId: string, scheduleId: string, profileId: string) => {
    logIntake(scheduleId, medId, profileId, 'TAKEN');
  };

  const handleSnooze = (medId: string, scheduleId: string, profileId: string) => {
    logIntake(scheduleId, medId, profileId, 'SNOOZED');
  };

  const handleSkip = (medId: string, scheduleId: string, profileId: string) => {
    logIntake(scheduleId, medId, profileId, 'SKIPPED');
  };

  const handleConfirmRefill = (medicationId: string, addedCount: number) => {
    updateStock(medicationId, addedCount);
  };

  const handleSaveProfile = async (newProfile: {
    name: string;
    relationship: string;
    color: string;
    age?: number;
    emergencyContact?: string;
  }) => {
    const created = await addProfile(newProfile);
    setActiveProfileId(created.id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>{t('app.name')}</Text>
          <Text style={styles.subTitle}>{t('app.tagline')}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            triggerSelectionHaptic();
            onNavigateToAddMedication();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ {t('medication.add_title')}</Text>
        </TouchableOpacity>
      </View>

      {/* Dependent Switcher */}
      <ProfileSwitcher
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={(id) => {
          triggerSelectionHaptic();
          setActiveProfileId(id);
        }}
        onAddProfile={() => {
          triggerSelectionHaptic();
          setIsAddProfileModalVisible(true);
        }}
      />

      {/* Main Medication List */}
      <View style={styles.listContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>
            {t('common.today')} {t('app.name')}
          </Text>
          <Text style={styles.countBadge}>{filteredMeds.length}</Text>
        </View>

        {filteredMeds.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💊</Text>
            <Text style={styles.emptyTitle}>{t('common.empty')}</Text>
            <Text style={styles.emptySubtitle}>
              የመድሃኒት መውሰጃ ሰዓት ለማዘጋጀት ከላይ ያለውን ቁልፍ ይጫኑ።
            </Text>
            <TouchableOpacity
              style={styles.emptyCtaButton}
              onPress={() => {
                triggerSelectionHaptic();
                onNavigateToAddMedication();
              }}
            >
              <Text style={styles.emptyCtaText}>+ አዲስ መድሃኒት መዝግብ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMeds}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const schedule = getScheduleForMed(item.id);
              const profile = profiles.find((p) => p.id === item.profileId);
              return (
                <MedicationCard
                  medication={item}
                  schedule={schedule}
                  patientName={profile?.name}
                  onTake={() =>
                    schedule && handleTake(item.id, schedule.id, item.profileId)
                  }
                  onSnooze={() =>
                    schedule && handleSnooze(item.id, schedule.id, item.profileId)
                  }
                  onSkip={() =>
                    schedule && handleSkip(item.id, schedule.id, item.profileId)
                  }
                  onRefill={() => {
                    triggerSelectionHaptic();
                    setSelectedMedForRefill(item);
                  }}
                />
              );
            }}
          />
        )}
      </View>

      {/* Interactive Add Dependent Modal */}
      <AddProfileModal
        visible={isAddProfileModalVisible}
        onClose={() => setIsAddProfileModalVisible(false)}
        onSave={handleSaveProfile}
      />

      {/* Interactive Refill Inventory Modal */}
      <RefillStockModal
        visible={selectedMedForRefill !== null}
        medication={selectedMedForRefill}
        onClose={() => setSelectedMedForRefill(null)}
        onConfirmRefill={handleConfirmRefill}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyCtaButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
