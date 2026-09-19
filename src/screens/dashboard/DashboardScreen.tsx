import React, { useEffect, useState, useMemo } from 'react';
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
import { MedicationCard } from '../../components/medication/MedicationCard';
import { AddProfileModal } from '../../components/dependent/AddProfileModal';
import { RefillStockModal } from '../../components/medication/RefillStockModal';
import { Medication } from '../../types/models';
import { triggerSelectionHaptic } from '../../utils/haptics';
import { THEME } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatLiveDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface DashboardScreenProps {
  onNavigateToAddMedication: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToAddMedication,
  onOpenNotifications,
  onOpenMenu,
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

  // Filter medications by active profile if set
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.teal} />

      {/* 1. Mədin Teal Header (Menu - Home - Notifications) */}
      <View style={styles.tealHeader}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => {
            triggerSelectionHaptic();
            onOpenMenu?.();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Home</Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={onOpenNotifications}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Live Date Pill */}
      <View style={styles.datePillBar}>
        <Ionicons name="calendar-outline" size={14} color={THEME.colors.teal} style={{ marginRight: 5 }} />
        <Text style={styles.datePillText}>{formatLiveDate(new Date())}</Text>
      </View>

      {/* 2. Main Content Feed */}
      <View style={styles.bodyContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Today's Medications</Text>
          <Text style={styles.countBadge}>{filteredMeds.length}</Text>
        </View>

        {filteredMeds.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="pill"
              size={54}
              color={THEME.colors.teal}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>No medications today</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button below to add your first Ethiopian time schedule.
            </Text>
            <TouchableOpacity
              style={styles.emptyCtaButton}
              onPress={() => {
                triggerSelectionHaptic();
                onNavigateToAddMedication();
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.emptyCtaText}>Add Medication</Text>
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
                  patientName={profile?.name ?? 'Patient'}
                  patientColor={profile?.color ?? THEME.colors.teal}
                  onTake={() =>
                    schedule && handleTake(item.id, schedule.id, item.profileId)
                  }
                  onSnooze={() =>
                    schedule && handleSnooze(item.id, schedule.id, item.profileId)
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

      {/* Modals */}
      <AddProfileModal
        visible={isAddProfileModalVisible}
        onClose={() => setIsAddProfileModalVisible(false)}
        onSave={handleSaveProfile}
      />

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
    backgroundColor: THEME.colors.canvas,
  },
  tealHeader: {
    height: 60,
    backgroundColor: THEME.colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  datePillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  countBadge: {
    backgroundColor: THEME.colors.tealLight,
    color: THEME.colors.tealDark,
    fontSize: 12,
    fontWeight: '800',
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
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyCtaButton: {
    backgroundColor: THEME.colors.coral,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
