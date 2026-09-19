import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  DiurnalPeriod,
  DIURNAL_PERIODS,
  EthiopianTime,
} from '../../types/ethiopianTime';
import {
  convertEthiopianToGregorianTime,
  convertGregorianToEthiopianTime,
  formatGregorianTimePreview,
  formatEthiopianTime,
} from '../../utils/ethiopianTime';
import { triggerSelectionHaptic } from '../../utils/haptics';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface EthiopianTimePickerProps {
  value: EthiopianTime;
  onChange: (time: EthiopianTime) => void;
}

type PickerMode = 'gregorian' | 'ethiopian';

const DIURNAL_TABS: DiurnalPeriod[] = ['TEWAT', 'KESEAT', 'MATA', 'LELIT'];

// Quick preset definitions
const PRESETS: Array<{ label: string; subLabel: string; gregHour: number; gregMinute: number }> = [
  { label: 'አሁን', subLabel: 'Current Time', gregHour: -1, gregMinute: -1 },
  { label: 'ጠዋት', subLabel: '8:00 AM', gregHour: 8, gregMinute: 0 },
  { label: 'ቀትር', subLabel: '12:00 PM', gregHour: 12, gregMinute: 0 },
  { label: 'ማታ', subLabel: '8:00 PM', gregHour: 20, gregMinute: 0 },
];

// Gregorian hours 1-12 for AM/PM mode
const GREG_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const ETH_HOURS_TEWAT_MATA = [12, 1, 2, 3, 4, 5];
const ETH_HOURS_KESEAT_LELIT = [6, 7, 8, 9, 10, 11];

export const EthiopianTimePicker: React.FC<EthiopianTimePickerProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<PickerMode>('gregorian');
  const [minuteInput, setMinuteInput] = useState('');

  // ── Derived values ──────────────────────────────────────────────────────────
  const gregTime = convertEthiopianToGregorianTime(value);
  const gregHour24 = gregTime.hour;
  const gregAmPm = gregHour24 >= 12 ? 'PM' : 'AM';
  const gregHour12 = gregHour24 % 12 === 0 ? 12 : gregHour24 % 12;
  const previewGregorian = formatGregorianTimePreview(gregHour24, gregTime.minute);
  const previewEthiopian = formatEthiopianTime(value, 'am');

  const ethAvailableHours =
    value.period === 'TEWAT' || value.period === 'MATA'
      ? ETH_HOURS_TEWAT_MATA
      : ETH_HOURS_KESEAT_LELIT;

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** Apply a Gregorian 24-hour time and convert to Ethiopian */
  const applyGregorianTime = (hour24: number, minute: number) => {
    const eth = convertGregorianToEthiopianTime({ hour: hour24, minute });
    onChange(eth);
  };

  /** Handle 12-hour AM/PM hour button press */
  const handleGregHour12Press = (h12: number) => {
    triggerSelectionHaptic();
    const isAm = gregAmPm === 'AM';
    let hour24: number;
    if (isAm) {
      hour24 = h12 === 12 ? 0 : h12;
    } else {
      hour24 = h12 === 12 ? 12 : h12 + 12;
    }
    applyGregorianTime(hour24, gregTime.minute);
  };

  /** Toggle AM/PM */
  const handleAmPmToggle = (period: 'AM' | 'PM') => {
    triggerSelectionHaptic();
    let hour24 = gregHour24;
    if (period === 'AM' && gregAmPm === 'PM') {
      hour24 = gregHour24 === 12 ? 0 : gregHour24 - 12;
    } else if (period === 'PM' && gregAmPm === 'AM') {
      hour24 = gregHour24 === 0 ? 12 : gregHour24 + 12;
    }
    applyGregorianTime(hour24, gregTime.minute);
  };

  /** Handle minute quick buttons (in Gregorian mode: 00 15 30 45) */
  const handleMinutePress = (min: number) => {
    triggerSelectionHaptic();
    applyGregorianTime(gregHour24, min);
    setMinuteInput('');
  };

  /** Handle free-form minute input */
  const handleMinuteInputChange = (text: string) => {
    setMinuteInput(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      applyGregorianTime(gregHour24, num);
    }
  };

  /** Ethiopian period tab press */
  const handlePeriodSelect = (period: DiurnalPeriod) => {
    triggerSelectionHaptic();
    const defaultHour = period === 'TEWAT' || period === 'MATA' ? 12 : 6;
    const newHour =
      period === 'TEWAT' || period === 'MATA'
        ? value.hour === 12 || (value.hour >= 1 && value.hour <= 5)
          ? value.hour
          : defaultHour
        : value.hour >= 6 && value.hour <= 11
        ? value.hour
        : defaultHour;
    onChange({ ...value, period, hour: newHour });
  };

  /** Ethiopian hour button */
  const handleEthHourSelect = (hour: number) => {
    triggerSelectionHaptic();
    onChange({ ...value, hour });
  };

  /** Ethiopian minute button */
  const handleEthMinuteSelect = (min: number) => {
    triggerSelectionHaptic();
    onChange({ ...value, minute: min });
  };

  /** Apply preset */
  const handlePreset = (preset: typeof PRESETS[number]) => {
    triggerSelectionHaptic();
    let h = preset.gregHour;
    let m = preset.gregMinute;
    if (h === -1) {
      const now = new Date();
      h = now.getHours();
      m = now.getMinutes();
    }
    applyGregorianTime(h, m);
    setMinuteInput('');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header row: title + mode toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>⏰ Reminder Time</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'gregorian' && styles.modeBtnActive]}
            onPress={() => { triggerSelectionHaptic(); setMode('gregorian'); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnText, mode === 'gregorian' && styles.modeBtnTextActive]}>
              📱 Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'ethiopian' && styles.modeBtnActive]}
            onPress={() => { triggerSelectionHaptic(); setMode('ethiopian'); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnText, mode === 'ethiopian' && styles.modeBtnTextActive]}>
              🇪🇹 Ethiopian
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live preview badge */}
      <View style={styles.previewBadge}>
        <View>
          <Text style={styles.previewBadgeGreg}>{previewGregorian}</Text>
          <Text style={styles.previewBadgeEth}>{previewEthiopian}</Text>
        </View>
        <Ionicons name="alarm-outline" size={28} color={THEME.colors.teal} />
      </View>

      {/* Quick presets */}
      <View style={styles.presetsRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={styles.presetChip}
            onPress={() => handlePreset(p)}
            activeOpacity={0.75}
          >
            <Text style={styles.presetLabel}>{p.label}</Text>
            <Text style={styles.presetSub}>{p.subLabel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── GREGORIAN (Standard Phone / Alarm) MODE ── */}
      {mode === 'gregorian' && (
        <View>
          {/* AM / PM toggle */}
          <View style={styles.amPmRow}>
            {(['AM', 'PM'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.amPmBtn, gregAmPm === p && styles.amPmBtnActive]}
                onPress={() => handleAmPmToggle(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.amPmText, gregAmPm === p && styles.amPmTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hour buttons 12-row layout */}
          <Text style={styles.subTitle}>Hour:</Text>
          <View style={styles.hourGrid}>
            {GREG_HOURS.map((h) => {
              const isSelected = gregHour12 === h;
              return (
                <TouchableOpacity
                  key={h}
                  style={[styles.hourButton, isSelected && styles.hourButtonSelected]}
                  onPress={() => handleGregHour12Press(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                    {h.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Minute – quick chips + text input */}
          <Text style={styles.subTitle}>Minute:</Text>
          <View style={styles.minuteRow}>
            {[0, 15, 30, 45].map((min) => {
              const isSelected = gregTime.minute === min && minuteInput === '';
              return (
                <TouchableOpacity
                  key={min}
                  style={[styles.minuteButton, isSelected && styles.minuteButtonSelected]}
                  onPress={() => handleMinutePress(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.minuteText, isSelected && styles.minuteTextSelected]}>
                    :{min.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Custom minute text input */}
          <View style={styles.customMinuteRow}>
            <Ionicons name="create-outline" size={16} color={THEME.colors.textSecondary} />
            <TextInput
              style={styles.minuteTextInput}
              placeholder="Custom minute (0–59)"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={2}
              value={minuteInput}
              onChangeText={handleMinuteInputChange}
              onBlur={() => {
                const num = parseInt(minuteInput, 10);
                if (isNaN(num) || num < 0 || num > 59) setMinuteInput('');
              }}
            />
          </View>
        </View>
      )}

      {/* ── ETHIOPIAN MODE ── */}
      {mode === 'ethiopian' && (
        <View>
          <Text style={styles.subTitle}>ዘመን (Period):</Text>
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

          <Text style={styles.subTitle}>ሰዓት (Hour):</Text>
          <View style={styles.hourGrid}>
            {ethAvailableHours.map((hour) => {
              const isSelected = value.hour === hour;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[styles.hourButton, isSelected && styles.hourButtonSelected]}
                  onPress={() => handleEthHourSelect(hour)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.subTitle}>ደቂቃ (Minute):</Text>
          <View style={styles.minuteRow}>
            {[0, 15, 30, 45].map((min) => {
              const isSelected = value.minute === min;
              return (
                <TouchableOpacity
                  key={min}
                  style={[styles.minuteButton, isSelected && styles.minuteButtonSelected]}
                  onPress={() => handleEthMinuteSelect(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.minuteText, isSelected && styles.minuteTextSelected]}>
                    :{min.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  modeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: THEME.colors.teal,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  previewBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.tealLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  previewBadgeGreg: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.tealDark,
  },
  previewBadgeEth: {
    fontSize: 12,
    color: THEME.colors.teal,
    fontWeight: '500',
    marginTop: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  presetSub: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  amPmRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  amPmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amPmBtnActive: {
    backgroundColor: THEME.colors.coral,
    borderColor: THEME.colors.coralDark,
  },
  amPmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  amPmTextActive: {
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 8,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  hourButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourButtonSelected: {
    backgroundColor: THEME.colors.teal,
    borderColor: THEME.colors.tealDark,
  },
  hourText: {
    fontSize: 14,
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  minuteButtonSelected: {
    backgroundColor: THEME.colors.teal,
    borderColor: THEME.colors.tealDark,
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
  customMinuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  minuteTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 4,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodTabSelected: {
    backgroundColor: THEME.colors.coral,
    borderColor: THEME.colors.coralDark,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  periodTabTextSelected: {
    color: '#FFFFFF',
  },
  periodSubText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  periodSubTextSelected: {
    color: '#FDEEE9',
  },
});
