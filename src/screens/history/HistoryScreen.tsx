import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { triggerSelectionHaptic } from '../../utils/haptics';

export const HistoryScreen: React.FC = () => {
  const { logs, medications, profiles } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState('April 2026');

  // Days in calendar (sample 30 days grid)
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  // Taken rate calculation
  const takenLogs = logs.filter((l) => l.status === 'TAKEN');
  const adherenceRate = logs.length > 0 ? Math.round((takenLogs.length / logs.length) * 100) : 88;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.teal} />

      {/* Teal Header */}
      <View style={styles.tealHeader}>
        <Text style={styles.headerTitle}>History</Text>
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
              // Mark some sample days as taken (teal) or missed (coral)
              const isTaken = day % 4 !== 0;
              const isMissed = day === 8 || day === 17 || day === 24;
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
            <Text style={styles.legendStat}>88%</Text>
          </View>
        </View>

        {/* Adherence Overview Box */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceRow}>
            <View>
              <Text style={styles.adherenceTitle}>Overall Adherence</Text>
              <Text style={styles.adherenceSub}>Weekly consistency score</Text>
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
        <Text style={styles.sectionHeading}>Recent Intake Logs</Text>

        {logs.length === 0 ? (
          <View style={styles.emptyLogsCard}>
            <Text style={styles.emptyLogsText}>
              Doses taken or snoozed will show up here chronologically.
            </Text>
          </View>
        ) : (
          logs.slice(0, 8).map((log) => {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  emptyLogsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
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
