import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { triggerSuccessHaptic, triggerSelectionHaptic } from '../../utils/haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { voiceService } from '../../services/audio/voiceService';

interface AlarmModalProps {
  visible: boolean;
  medicationName: string;
  patientName: string;
  dosage: string;
  onTake: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  visible,
  medicationName,
  patientName,
  dosage,
  onTake,
  onSnooze,
  onDismiss,
}) => {
  // Continuous Amharic voice alarm loop:
  // Starts ringing "መድሃኒትዎን የሚወስዱበት ሰዓት ደርሷል" repeatedly when visible,
  // and silences immediately upon Taken, Snooze, or Dismiss.
  useEffect(() => {
    if (visible) {
      voiceService.startAlarmLoop();
    } else {
      voiceService.stopAlarmLoop();
    }

    return () => {
      voiceService.stopAlarmLoop();
    };
  }, [visible]);

  const handleTakePress = () => {
    voiceService.stopAlarmLoop();
    triggerSuccessHaptic();
    onTake();
  };

  const handleSnoozePress = () => {
    voiceService.stopAlarmLoop();
    triggerSelectionHaptic();
    onSnooze();
  };

  const handleDismissPress = () => {
    voiceService.stopAlarmLoop();
    onDismiss();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleDismissPress}>
      <View style={styles.overlay}>
        <View style={styles.alertCard}>
          {/* Glowing Bell Icon */}
          <View style={styles.bellHalo}>
            <Ionicons name="notifications" size={32} color={THEME.colors.coral} />
          </View>

          <Text style={styles.alertTitle}>የመድሃኒት ማስታወሻ • Reminder</Text>
          <Text style={styles.alertSubtitle}>
            Your medicine intake for <Text style={styles.highlightText}>{patientName}</Text> is due.
          </Text>

          {/* Repeating Voice Banner Indicator */}
          <View style={styles.voiceIndicatorBadge}>
            <Ionicons name="volume-high" size={18} color={THEME.colors.coral} />
            <Text style={styles.voiceIndicatorText}>
              "መድሃኒትዎን የሚወስዱበት ሰዓት ደርሷል"
            </Text>
          </View>

          {/* Pill Card Box */}
          <View style={styles.medBox}>
            <MaterialCommunityIcons name="pill" size={24} color={THEME.colors.teal} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.medNameText}>{medicationName}</Text>
              <Text style={styles.dosageText}>{dosage}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.takenBtn]}
              onPress={handleTakePress}
              activeOpacity={0.8}
            >
              <Text style={styles.takenBtnText}>ወሰድኩ • Taken</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.snoozeBtn]}
              onPress={handleSnoozePress}
              activeOpacity={0.8}
            >
              <Text style={styles.snoozeBtnText}>አቆይ • Snooze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    backgroundColor: '#242F35',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#37474F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  bellHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(242, 110, 86, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 110, 86, 0.3)',
  },
  bellIcon: {
    fontSize: 30,
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  highlightText: {
    color: THEME.colors.coral,
    fontWeight: '700',
  },
  voiceIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 110, 86, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 110, 86, 0.3)',
  },
  voiceIndicatorText: {
    color: THEME.colors.coral,
    fontSize: 13,
    fontWeight: '700',
  },
  medBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C252A',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#37474F',
  },
  medIcon: {
    fontSize: 24,
  },
  medNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dosageText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenBtn: {
    backgroundColor: THEME.colors.coral,
  },
  takenBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  snoozeBtn: {
    backgroundColor: '#37474F',
  },
  snoozeBtnText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
});
