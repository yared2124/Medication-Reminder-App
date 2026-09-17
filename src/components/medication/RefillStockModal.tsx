import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Medication } from '../../types/models';
import { triggerSuccessHaptic, triggerSelectionHaptic } from '../../utils/haptics';
import { t } from '../../i18n';
import { THEME } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface RefillStockModalProps {
  visible: boolean;
  medication: Medication | null;
  onClose: () => void;
  onConfirmRefill: (medicationId: string, addedCount: number) => void;
}

const PRESET_AMOUNTS = [10, 30, 60];

export const RefillStockModal: React.FC<RefillStockModalProps> = ({
  visible,
  medication,
  onClose,
  onConfirmRefill,
}) => {
  const [amount, setAmount] = useState('30');

  if (!medication) return null;

  const currentCount = medication.stockCount;
  const parsedAdd = parseInt(amount, 10) || 0;
  const projectedCount = currentCount + parsedAdd;

  const handlePreset = (val: number) => {
    triggerSelectionHaptic();
    setAmount(val.toString());
  };

  const handleConfirm = () => {
    if (parsedAdd <= 0) return;
    triggerSuccessHaptic();
    onConfirmRefill(medication.id, parsedAdd);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="pill" size={22} color={THEME.colors.teal} />
            <Text style={styles.title}>{t('medication.refill_stock')}</Text>
          </View>
          <Text style={styles.subtitle}>
            ለ <Text style={styles.medHighlight}>{medication.name}</Text> ተጨማሪ ክምችት ይመዝግቡ
          </Text>

          {/* Current Stock vs Projected */}
          <View style={styles.statBox}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>አሁን ያለው (Current):</Text>
              <Text style={styles.statValue}>{currentCount} ኪኒን</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>አዲስ ድምር (New Total):</Text>
              <Text style={[styles.statValue, styles.projectedValue]}>
                {projectedCount} ኪኒን
              </Text>
            </View>
          </View>

          {/* Quick Preset Buttons */}
          <Text style={styles.presetsLabel}>የተለመዱ መጠኖች (Quick Presets):</Text>
          <View style={styles.presetRow}>
            {PRESET_AMOUNTS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetBtn,
                  parsedAdd === preset && styles.presetBtnActive,
                ]}
                onPress={() => handlePreset(preset)}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    parsedAdd === preset && styles.presetBtnTextActive,
                  ]}
                >
                  +{preset} ኪኒን
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <Text style={styles.presetsLabel}>ወይም ሌላ ቁጥር ያስገቡ (Custom):</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="30"
          />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, parsedAdd <= 0 && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={parsedAdd <= 0}
            >
              <Text style={styles.confirmBtnText}>{t('common.confirm')}</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  medHighlight: {
    color: THEME.colors.teal,
    fontWeight: '700',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  projectedValue: {
    color: '#16A34A',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#94A3B8',
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  presetBtnActive: {
    backgroundColor: THEME.colors.teal,
    borderColor: THEME.colors.tealDark,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
