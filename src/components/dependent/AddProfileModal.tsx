import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { t } from '../../i18n';

interface AddProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (profile: {
    name: string;
    relationship: string;
    color: string;
    age?: number;
    emergencyContact?: string;
  }) => void;
}

const RELATIONSHIP_PRESETS = [
  { label: 'እኔ (Self)', value: 'Self' },
  { label: 'እናት (Mother)', value: 'Mother' },
  { label: 'አባት (Father)', value: 'Father' },
  { label: 'ልጅ (Child)', value: 'Child' },
  { label: 'አያት (Grandparent)', value: 'Grandparent' },
  { label: 'ሌላ (Other)', value: 'Other' },
];

const COLOR_PALETTE = [
  THEME.colors.coral, // Coral / Orange (Brand Accent)
  '#EC4899', // Rose Pink
  '#059669', // Emerald Green
  '#7C3AED', // Twilight Violet
  '#D97706', // Sunrise Amber
  THEME.colors.teal, // Teal (Brand)
];

export const AddProfileModal: React.FC<AddProfileModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Mother');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[1]);
  const [age, setAge] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    triggerSuccessHaptic();
    onSave({
      name: name.trim(),
      relationship,
      color: selectedColor,
      age: age ? parseInt(age, 10) : undefined,
      emergencyContact: emergencyContact.trim() || undefined,
    });
    // Reset
    setName('');
    setAge('');
    setEmergencyContact('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>+ {t('profile.add')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Relationship Chips */}
            <Text style={styles.inputLabel}>{t('profile.relationship_label')}</Text>
            <View style={styles.presetRow}>
              {RELATIONSHIP_PRESETS.map((preset) => {
                const isSelected = relationship === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipSelected,
                    ]}
                    onPress={() => {
                      triggerSelectionHaptic();
                      setRelationship(preset.value);
                      if (!name && preset.value !== 'Self' && preset.value !== 'Other') {
                        setName(preset.label.split(' ')[0]);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>{t('profile.name_label')} *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('profile.name_placeholder')}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            {/* Color Swatch */}
            <Text style={styles.inputLabel}>የመለያ ቀለም (Profile Color)</Text>
            <View style={styles.colorRow}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      isSelected && styles.colorCircleSelected,
                    ]}
                    onPress={() => {
                      triggerSelectionHaptic();
                      setSelectedColor(color);
                    }}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Age & Emergency Contact */}
            <View style={styles.dualRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('profile.age_label')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="65"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                  value={age}
                  onChangeText={setAge}
                />
              </View>

              <View style={{ flex: 2 }}>
                <Text style={styles.inputLabel}>{t('profile.emergency_contact')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0911..."
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  presetChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  presetChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: THEME.colors.coral,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
