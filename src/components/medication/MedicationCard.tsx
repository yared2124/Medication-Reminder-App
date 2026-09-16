import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Medication, Schedule } from '../../types/models';
import { formatEthiopianTime } from '../../utils/ethiopianTime';
import {
  triggerSuccessHaptic,
  triggerSelectionHaptic,
  triggerWarningHaptic,
} from '../../utils/haptics';
import { voiceService } from '../../services/audio/voiceService';
import { t } from '../../i18n';

interface MedicationCardProps {
  medication: Medication;
  schedule?: Schedule;
  patientName?: string;
  onTake?: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
  onRefill?: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  schedule,
  patientName = 'ውድ ታካሚ',
  onTake,
  onSnooze,
  onSkip,
  onRefill,
}) => {
  const isLowStock = medication.stockCount <= medication.lowStockThreshold;
  const timeDisplay = schedule
    ? formatEthiopianTime(schedule.ethiopianTime, 'am')
    : null;

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
      {/* Header: Medication Name & Time Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.medName}>{medication.name}</Text>
          <Text style={styles.dosageText}>
            {medication.dosage} • {t(`meal.${medication.mealTiming}`)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Audio Accessibility Button */}
          <TouchableOpacity
            style={styles.speakerButton}
            onPress={handleSpeak}
            accessibilityLabel="የድምፅ ማስታወሻ አጫውት"
            activeOpacity={0.7}
          >
            <Text style={styles.speakerIcon}>🔊</Text>
          </TouchableOpacity>

          {timeDisplay && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{timeDisplay}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stock Bar */}
      <View style={styles.stockRow}>
        <View style={styles.stockInfo}>
          <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
            {t('medication.stock_label')}: {medication.stockCount}
          </Text>
          {isLowStock && (
            <Text style={styles.warningTag}>
              {t('medication.low_stock_warning', { days: 3 })}
            </Text>
          )}
        </View>

        {isLowStock && onRefill && (
          <TouchableOpacity style={styles.refillButton} onPress={onRefill}>
            <Text style={styles.refillButtonText}>{t('actions.refill')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.takeBtn]}
          onPress={() => {
            triggerSuccessHaptic();
            onTake?.();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.takeBtnText}>✓ {t('actions.take')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.snoozeBtn]}
          onPress={() => {
            triggerSelectionHaptic();
            onSnooze?.();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.snoozeBtnText}>⏰ {t('actions.snooze')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.skipBtn]}
          onPress={() => {
            triggerWarningHaptic();
            onSkip?.();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>{t('actions.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakerButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  speakerIcon: {
    fontSize: 14,
  },
  medName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  timeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeBadgeText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  lowStockText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  warningTag: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  refillButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  refillButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeBtn: {
    backgroundColor: '#16A34A',
    flex: 1.5,
  },
  takeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  snoozeBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  snoozeBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  skipBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skipBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
});
