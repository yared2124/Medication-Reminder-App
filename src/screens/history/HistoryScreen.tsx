import React, { useState, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';

// ── Calendar helpers ──────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Days in a given month (1-indexed month) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 0=Sunday day of the week the month starts on */
function monthStartDay(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ── Component ─────────────────────────────────────────────────────────────────

export const HistoryScreen: React.FC = () => {
  const { logs, medications, profiles, clearHistory } = useAppStore();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('ALL');

  // Live calendar state: initialise to phone's current month & year
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1); // 1-indexed

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    triggerSelectionHaptic();
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    triggerSelectionHaptic();
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    triggerSelectionHaptic();
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth() + 1);
  };

  const isCurrentMonthView =
    calYear === today.getFullYear() && calMonth === today.getMonth() + 1;

  // ── Calendar grid ────────────────────────────────────────────────────────────
  const totalDays = daysInMonth(calYear, calMonth);
  const startWeekday = monthStartDay(calYear, calMonth); // 0=Sun
  // Build grid: leading nulls + actual days
  const calendarCells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  // ── Log filtering ────────────────────────────────────────────────────────────
  const filteredLogs = useMemo(
    () =>
      selectedProfileId === 'ALL'
        ? logs
        : logs.filter((l) => l.profileId === selectedProfileId),
    [logs, selectedProfileId]
  );

  /** All filtered logs within the currently-viewed calendar month */
  const monthLogs = useMemo(
    () =>
      filteredLogs.filter((l) => {
        const d = new Date(l.scheduledTime);
        return d.getFullYear() === calYear && d.getMonth() + 1 === calMonth;
      }),
    [filteredLogs, calYear, calMonth]
  );

  /** Returns 'taken' | 'missed' | 'none' for a given calendar day */
  const getDayStatus = (day: number): 'taken' | 'missed' | 'none' => {
    const dayLogs = monthLogs.filter((l) => {
      const d = new Date(l.scheduledTime);
      return d.getDate() === day;
    });
    if (dayLogs.length === 0) return 'none';
    const hasMissed = dayLogs.some((l) => l.status === 'MISSED');
    return hasMissed ? 'missed' : 'taken';
  };

  // ── Adherence ────────────────────────────────────────────────────────────────
  const takenInMonth = monthLogs.filter((l) => l.status === 'TAKEN').length;
  const adherenceRate =
    monthLogs.length > 0
      ? Math.round((takenInMonth / monthLogs.length) * 100)
      : filteredLogs.length === 0 && logs.length === 0
      ? 100
      : monthLogs.length === 0 && filteredLogs.length > 0
      ? 0
      : 100;

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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.teal} />

      {/* Teal Header */}
      <View style={styles.tealHeader}>
        <View style={{ width: 80 }} />
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearHistory}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.clearBtnText}>አጽዳ</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Filter Bar */}
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.patientChip, selectedProfileId === 'ALL' && styles.patientChipActive]}
            onPress={() => { triggerSelectionHaptic(); setSelectedProfileId('ALL'); }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people"
              size={14}
              color={selectedProfileId === 'ALL' ? '#FFFFFF' : THEME.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.patientChipText, selectedProfileId === 'ALL' && styles.patientChipTextActive]}>
              ሁሉም (All)
            </Text>
          </TouchableOpacity>

          {profiles.map((p) => {
            const isSelected = selectedProfileId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.patientChip, isSelected && styles.patientChipActive]}
                onPress={() => { triggerSelectionHaptic(); setSelectedProfileId(p.id); }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatarDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : (p.color || THEME.colors.teal) },
                  ]}
                />
                <Text style={[styles.patientChipText, isSelected && styles.patientChipTextActive]}>
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
          {/* Month Header with Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={22} color={THEME.colors.teal} />
            </TouchableOpacity>
            <View style={styles.monthTitleGroup}>
              <Text style={styles.monthTitle}>{MONTH_NAMES[calMonth - 1]} {calYear}</Text>
              {!isCurrentMonthView && (
                <TouchableOpacity onPress={goToToday} style={styles.todayBadge} activeOpacity={0.7}>
                  <Text style={styles.todayBadgeText}>Today ↩</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={22} color={THEME.colors.teal} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const isToday =
                isCurrentMonthView && day === today.getDate();
              const status = getDayStatus(day);
              const isTaken = status === 'taken';
              const isMissed = status === 'missed';

              return (
                <View
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && styles.dayCellToday,
                    isMissed && styles.dayCellMissed,
                    isTaken && !isMissed && styles.dayCellTaken,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      (isTaken || isMissed) && styles.dayTextWhite,
                      isToday && !isTaken && !isMissed && styles.dayTextToday,
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
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 2, borderColor: THEME.colors.teal, backgroundColor: 'transparent' }]} />
              <Text style={styles.legendLabel}>Today</Text>
            </View>
            <Text style={styles.legendStat}>{adherenceRate}%</Text>
          </View>
        </View>

        {/* Adherence Overview */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceRow}>
            <View>
              <Text style={styles.adherenceTitle}>
                {currentPatient ? `${currentPatient.name}'s Adherence` : 'Overall Adherence'}
              </Text>
              <Text style={styles.adherenceSub}>
                {MONTH_NAMES[calMonth - 1]} {calYear} • {monthLogs.length} logs recorded
              </Text>
            </View>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>{adherenceRate}%</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${adherenceRate}%` as any }]} />
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
            <Ionicons
              name="clipboard-outline"
              size={42}
              color={THEME.colors.teal}
              style={{ marginBottom: 8 }}
            />
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
                  <Ionicons
                    name={isTaken ? 'checkmark' : 'time-outline'}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>
                    {med?.name ?? 'Medication'} • {log.status}
                  </Text>
                  <Text style={styles.logSub}>
                    {prof?.name ?? 'Patient'} •{' '}
                    {new Date(log.scheduledTime).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    {new Date(log.scheduledTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  monthTitleGroup: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  todayBadge: {
    marginTop: 3,
    backgroundColor: THEME.colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    color: THEME.colors.teal,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayCellToday: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: THEME.colors.teal,
  },
  dayCellTaken: {
    borderRadius: 18,
    backgroundColor: THEME.colors.teal,
  },
  dayCellMissed: {
    borderRadius: 18,
    backgroundColor: THEME.colors.coral,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
  dayTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: THEME.colors.teal,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  legendStat: {
    marginLeft: 'auto',
    fontSize: 13,
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
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
