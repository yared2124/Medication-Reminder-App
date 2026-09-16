import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  DiurnalPeriod,
  DIURNAL_PERIODS,
  EthiopianTime,
} from '../../types/ethiopianTime';
import {
  convertEthiopianToGregorianTime,
  formatGregorianTimePreview,
} from '../../utils/ethiopianTime';
import { triggerSelectionHaptic } from '../../utils/haptics';

interface EthiopianTimePickerProps {
  value: EthiopianTime;
  onChange: (time: EthiopianTime) => void;
}

const DIURNAL_TABS: DiurnalPeriod[] = ['TEWAT', 'KESEAT', 'MATA', 'LELIT'];

export const EthiopianTimePicker: React.FC<EthiopianTimePickerProps> = ({
  value,
  onChange,
}) => {
  // Hours available for selected period
  const availableHours =
    value.period === 'TEWAT' || value.period === 'MATA'
      ? [12, 1, 2, 3, 4, 5]
      : [6, 7, 8, 9, 10, 11];

  const minuteOptions = [0, 15, 30, 45];

  const handlePeriodSelect = (period: DiurnalPeriod) => {
    triggerSelectionHaptic();
    // If current hour doesn't belong to new period, reset to period start
    const defaultHour = period === 'TEWAT' || period === 'MATA' ? 12 : 6;
    const newHour =
      period === 'TEWAT' || period === 'MATA'
        ? value.hour === 12 || (value.hour >= 1 && value.hour <= 5)
          ? value.hour
          : defaultHour
        : value.hour >= 6 && value.hour <= 11
        ? value.hour
        : defaultHour;

    onChange({
      ...value,
      period,
      hour: newHour,
    });
  };

  const handleHourSelect = (hour: number) => {
    triggerSelectionHaptic();
    onChange({
      ...value,
      hour,
    });
  };

  const handleMinuteSelect = (minute: number) => {
    triggerSelectionHaptic();
    onChange({
      ...value,
      minute,
    });
  };

  const gregTime = convertEthiopianToGregorianTime(value);
  const previewGregorian = formatGregorianTimePreview(gregTime.hour, gregTime.minute);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>የኢትዮጵያ ሰዓት መምረጫ (Ethiopian Time)</Text>

      {/* 1. Diurnal Period Tabs (ጠዋት, ከሰዓት, ማታ, ሌሊት) */}
      <View style={styles.periodRow}>
        {DIURNAL_TABS.map((period) => {
          const isSelected = value.period === period;
          const meta = DIURNAL_PERIODS[period];
          return (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, isSelected && styles.periodTabSelected]}
              onPress={() => handlePeriodSelect(period)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodTabText, isSelected && styles.periodTabTextSelected]}>
                {meta.amharicLabel}
              </Text>
              <Text style={[styles.periodSubText, isSelected && styles.periodSubTextSelected]}>
                {meta.englishLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Hour Selection Dial */}
      <Text style={styles.subTitle}>ሰዓት (Hour):</Text>
      <View style={styles.hourRow}>
        {availableHours.map((hour) => {
          const isSelected = value.hour === hour;
          return (
            <TouchableOpacity
              key={hour}
              style={[styles.hourButton, isSelected && styles.hourButtonSelected]}
              onPress={() => handleHourSelect(hour)}
              activeOpacity={0.7}
            >
              <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                {hour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Minute Selection */}
      <Text style={styles.subTitle}>ደቂቃ (Minute):</Text>
      <View style={styles.minuteRow}>
        {minuteOptions.map((min) => {
          const isSelected = value.minute === min;
          return (
            <TouchableOpacity
              key={min}
              style={[styles.minuteButton, isSelected && styles.minuteButtonSelected]}
              onPress={() => handleMinuteSelect(min)}
              activeOpacity={0.7}
            >
              <Text style={[styles.minuteText, isSelected && styles.minuteTextSelected]}>
                :{min.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Live Gregorian Conversion Preview Badge */}
      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>የስልክ መደበኛ ሰዓት (Gregorian System Time):</Text>
        <Text style={styles.previewValue}>{previewGregorian}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 8,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodTabSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  periodTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  periodTabTextSelected: {
    color: '#FFFFFF',
  },
  periodSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  periodSubTextSelected: {
    color: '#BFDBFE',
  },
  hourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  hourButton: {
    width: '14.5%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourButtonSelected: {
    backgroundColor: '#1E293B',
    borderColor: '#0F172A',
  },
  hourText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  hourTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  minuteRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  minuteButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  minuteButtonSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0369A1',
  },
  minuteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  minuteTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});
