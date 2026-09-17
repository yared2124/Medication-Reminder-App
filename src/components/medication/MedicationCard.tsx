import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Medication, Schedule } from '../../types/models';
import { formatEthiopianTime } from '../../utils/ethiopianTime';
import {
  triggerSuccessHaptic,
  triggerSelectionHaptic,
} from '../../utils/haptics';
import { voiceService } from '../../services/audio/voiceService';
import { THEME } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '../../i18n';

interface MedicationCardProps {
  medication: Medication;
  schedule?: Schedule;
  patientName?: string;
  patientColor?: string;
  onTake?: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
  onRefill?: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  schedule,
  patientName = 'Yared',
  patientColor = THEME.colors.teal,
  onTake,
  onSnooze,
  onRefill,
}) => {
  const isLowStock = medication.stockCount <= medication.lowStockThreshold;
  const timeDisplay = schedule
    ? formatEthiopianTime(schedule.ethiopianTime, 'am')
    : 'ጠዋት 02:00';

  const handleSpeak = () => {
    triggerSelectionHaptic();
    const mealText = t(`meal.${medication.mealTiming}`);
    voiceService.speakReminder(
      patientName,
      medication.name,
      medication.dosage,
      mealText
    );
  };

  return (
    <View style={styles.card}>
      {/* 1. Header: Patient Info (Left) & Ethiopian Time (Right) */}
      <View style={styles.headerRow}>
        <View style={styles.patientBadge}>
          <View style={[styles.avatarCircle, { backgroundColor: patientColor }]}>
            <Text style={styles.avatarText}>{patientName.charAt(0)}</Text>
          </View>
          <Text style={styles.patientName}>{patientName}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Audio Accessibility Button */}
          <TouchableOpacity
            style={styles.speakerButton}
            onPress={handleSpeak}
            accessibilityLabel="የድምፅ ማስታወሻ አጫውት"
            activeOpacity={0.7}
          >
            <Ionicons name="volume-medium" size={17} color={THEME.colors.teal} />
          </TouchableOpacity>

          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>
      </View>

      {/* 2. Medication Details */}
      <View style={styles.medDetails}>
        <View style={styles.medTitleRow}>
          <MaterialCommunityIcons name="pill" size={18} color={THEME.colors.teal} style={{ marginRight: 6 }} />
          <Text style={styles.medName}>{medication.name}</Text>
        </View>
        <Text style={styles.dosageText}>
          {medication.dosage} • {t(`meal.${medication.mealTiming}`)}
        </Text>
      </View>

      {/* 3. Stock warning (if low) */}
      {isLowStock && (
        <View style={styles.stockAlertRow}>
          <Ionicons name="alert-circle" size={16} color={THEME.colors.coral} style={{ marginRight: 4 }} />
          <Text style={styles.stockAlertText}>
            {t('medication.low_stock_warning', { days: 3 })} ({medication.stockCount} ቀሪ)
          </Text>
          {onRefill && (
            <TouchableOpacity onPress={onRefill} style={styles.refillLink}>
              <Text style={styles.refillLinkText}>{t('actions.refill')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Action Buttons matching Mədin Design */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.takenBtn]}
          onPress={() => {
            triggerSuccessHaptic();
            onTake?.();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.takenBtnText}>Taken</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.snoozeBtn]}
          onPress={() => {
            triggerSelectionHaptic();
            onSnooze?.();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.snoozeBtnText}>Snooze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EBF1F1',
    ...THEME.shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakerButton: {
    backgroundColor: '#F7FAF9',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  speakerIcon: {
    fontSize: 13,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  medDetails: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  medTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pillIcon: {
    fontSize: 16,
  },
  medName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  dosageText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
    paddingLeft: 22,
  },
  stockAlertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.coralLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  stockAlertText: {
    fontSize: 11,
    color: THEME.colors.coralDark,
    fontWeight: '600',
  },
  refillLink: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  refillLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.coralDark,
    textDecorationLine: 'underline',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenBtn: {
    backgroundColor: THEME.colors.coral,
    shadowColor: THEME.colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  takenBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  snoozeBtn: {
    backgroundColor: THEME.colors.snoozeBg,
  },
  snoozeBtnText: {
    color: THEME.colors.snoozeText,
    fontSize: 15,
    fontWeight: '600',
  },
});
