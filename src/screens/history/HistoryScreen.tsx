import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';

export const HistoryScreen: React.FC = () => {
  const { logs, medications, profiles, clearHistory } = useAppStore();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState('April 2026');

  // Days in calendar (sample 30 days grid)
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  // Filter logs by selected patient
  const filteredLogs =
    selectedProfileId === 'ALL'
      ? logs
      : logs.filter((l) => l.profileId === selectedProfileId);

  // Taken rate calculation for selected patient
  const takenLogs = filteredLogs.filter((l) => l.status === 'TAKEN');
  const adherenceRate =
    filteredLogs.length > 0
      ? Math.round((takenLogs.length / filteredLogs.length) * 100)
      : filteredLogs.length === 0 && logs.length === 0
      ? 100
      : 88;

  const currentPatient = profiles.find((p) => p.id === selectedProfileId);

  const handleClearHistory = () => {
    const targetName = currentPatient ? currentPatient.name : 'ሁሉንም (All Patients)';

    Alert.alert(
      'የመድሃኒት ታሪክ ማጽጃ (Reset History)',
      `ይህ የ${targetName} የመድሃኒት መውሰጃ ታሪክ ሙሉ በሙሉ ከዜሮ እንዲጀምር ያጠፋዋል። እርግጠኛ ነዎት?`,
      [
        { text: 'ሰርዝ (Cancel)', style: 'cancel' },
        {
          text: 'አዎ አጥፋ (Reset to Zero)',
          style: 'destructive',
          onPress: async () => {
            triggerSuccessHaptic();
            await clearHistory(selectedProfileId === 'ALL' ? undefined : selectedProfileId);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.teal} />

      {/* Teal Header with Reset Action */}
      <View style={styles.tealHeader}>
        <View style={{ width: 80 }} />
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.clearBtnText}>አጽዳ 🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Selector Filter Bar */}
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[
              styles.patientChip,
              selectedProfileId === 'ALL' && styles.patientChipActive,
            ]}
            onPress={() => {
              triggerSelectionHaptic();
              setSelectedProfileId('ALL');
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.patientChipText,
                selectedProfileId === 'ALL' && styles.patientChipTextActive,
              ]}
            >
              👥 ሁሉም (All)
            </Text>
          </TouchableOpacity>

          {profiles.map((p) => {
            const isSelected = selectedProfileId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.patientChip,
                  isSelected && styles.patientChipActive,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setSelectedProfileId(p.id);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatarDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : (p.color || THEME.colors.teal) },
                  ]}
                />
                <Text
                  style={[
                    styles.patientChipText,
                    isSelected && styles.patientChipTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => triggerSelectionHaptic()}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{selectedMonth}</Text>
            <TouchableOpacity onPress={() => triggerSelectionHaptic()}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Days of Week Row */}
          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {days.map((day) => {
              // Mark days
              const hasLogs = filteredLogs.length > 0;
              const isTaken = hasLogs && day % 4 !== 0;
              const isMissed = hasLogs && (day === 8 || day === 17 || day === 24);
              const isCurrent = day === 16;

              return (
                <View
                  key={day}
                  style={[
                    styles.dayCell,
                    isCurrent && styles.dayCellCurrent,
                    isMissed && styles.dayCellMissed,
                    isTaken && !isMissed && styles.dayCellTaken,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      (isTaken || isMissed) && styles.dayTextWhite,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.teal }]} />
              <Text style={styles.legendLabel}>Taken</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.coral }]} />
              <Text style={styles.legendLabel}>Missed</Text>
            </View>
            <Text style={styles.legendStat}>{adherenceRate}%</Text>
          </View>
        </View>

        {/* Adherence Overview Box */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceRow}>
            <View>
              <Text style={styles.adherenceTitle}>
                {currentPatient ? `${currentPatient.name}'s Adherence` : 'Overall Adherence'}
              </Text>
              <Text style={styles.adherenceSub}>
                {currentPatient ? `${currentPatient.name} የመድሃኒት ተከታታይነት` : 'የሳምንቱ አጠቃላይ አፈጻጸም'}
              </Text>
            </View>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>{adherenceRate}%</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${adherenceRate}%` }]} />
          </View>
        </View>

        {/* Logs Feed */}
        <View style={styles.headingRow}>
          <Text style={styles.sectionHeading}>
            {currentPatient ? `${currentPatient.name} - Recent Logs` : 'Recent Intake Logs'}
          </Text>
          {filteredLogs.length > 0 && (
            <Text style={styles.logCountBadge}>{filteredLogs.length} መረጃዎች</Text>
          )}
        </View>

        {filteredLogs.length === 0 ? (
          <View style={styles.emptyLogsCard}>
            <Text style={styles.emptyLogsIcon}>📋</Text>
            <Text style={styles.emptyLogsTitle}>ምንም የተመዘገበ ታሪክ የለም (ባዶ ነው)</Text>
            <Text style={styles.emptyLogsText}>
              {currentPatient
                ? `ለ${currentPatient.name} የመድሃኒት መውሰጃ ታሪክ አልተገኘም ወይም ከዜሮ ተጀምሯል።`
                : 'የመድሃኒት መውሰጃ ታሪክ ሲመዘገብ ወይም ሲወሰድ እዚህ ጋር ይታያል። ታሪኩ ጸድቶ ከዜሮ ተጀምሯል።'}
            </Text>
          </View>
        ) : (
          filteredLogs.slice(0, 15).map((log) => {
            const med = medications.find((m) => m.id === log.medicationId);
            const prof = profiles.find((p) => p.id === log.profileId);
            const isTaken = log.status === 'TAKEN';

            return (
              <View key={log.id} style={styles.logCard}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isTaken ? THEME.colors.teal : THEME.colors.coral },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{isTaken ? '✓' : '⏰'}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>
                    {med?.name ?? 'Medication'} • {log.status}
                  </Text>
                  <Text style={styles.logSub}>
                    {prof?.name ?? 'Patient'} • {new Date(log.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  patientChipActive: {
    backgroundColor: THEME.colors.teal,
    borderColor: THEME.colors.tealDark,
  },
  avatarDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  patientChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  patientChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...THEME.shadow.card,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  navArrow: {
    fontSize: 22,
    color: THEME.colors.teal,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 6,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  dayCellCurrent: {
    borderWidth: 2,
    borderColor: THEME.colors.teal,
  },
  dayCellTaken: {
    backgroundColor: THEME.colors.teal,
  },
  dayCellMissed: {
    backgroundColor: THEME.colors.coral,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  dayTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  legendStat: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.teal,
  },
  adherenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    ...THEME.shadow.card,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  adherenceSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  percentageCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.tealDark,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.teal,
    borderRadius: 4,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.teal,
    backgroundColor: THEME.colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyLogsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...THEME.shadow.card,
  },
  emptyLogsIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyLogsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyLogsText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    ...THEME.shadow.card,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
