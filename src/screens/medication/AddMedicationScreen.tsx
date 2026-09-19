import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { EthiopianTimePicker } from '../../components/time-picker/EthiopianTimePicker';
import { EthiopianTime } from '../../types/ethiopianTime';
import { MealTiming } from '../../types/models';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { t } from '../../i18n';
import { convertGregorianToEthiopianTime } from '../../utils/ethiopianTime';

import { AddProfileModal } from '../../components/dependent/AddProfileModal';

interface AddMedicationScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const MEAL_TIMINGS: MealTiming[] = [
  'BEFORE_MEAL',
  'AFTER_MEAL',
  'WITH_MEAL',
  'ANYTIME',
];

/** Returns an EthiopianTime object corresponding to the phone's current clock time */
function getCurrentEthiopianTime(): EthiopianTime {
  const now = new Date();
  return convertGregorianToEthiopianTime({ hour: now.getHours(), minute: now.getMinutes() });
}

export const AddMedicationScreen: React.FC<AddMedicationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { profiles, activeProfileId, addMedicationWithSchedule, addProfile } = useAppStore();

  const [isAddProfileModalVisible, setIsAddProfileModalVisible] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    activeProfileId || (profiles[0]?.id ?? '')
  );
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  const [mealTiming, setMealTiming] = useState<MealTiming>('AFTER_MEAL');
  const [stockCount, setStockCount] = useState('30');
  // ✅ Default to phone's current time instead of static hardcoded 02:00 TEWAT
  const [ethiopianTime, setEthiopianTime] = useState<EthiopianTime>(getCurrentEthiopianTime());


  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a medication name.');
      return;
    }

    if (!selectedProfileId) {
      Alert.alert('Required', 'Please select a patient profile.');
      return;
    }

    triggerSuccessHaptic();
    const parsedStock = parseInt(stockCount, 10) || 30;

    await addMedicationWithSchedule(
      {
        profileId: selectedProfileId,
        name: name.trim(),
        dosage: dosage.trim() || '1 Tablet',
        dosageAmount: 1,
        mealTiming,
        stockCount: parsedStock,
        lowStockThreshold: 6,
      },
      ethiopianTime
    );

    onSuccess();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.teal} />

      {/* 1. Mədin Teal Header (< Add Medication) */}
      <View style={styles.tealHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Patient Selection */}
        <View style={styles.patientHeaderRow}>
          <Text style={styles.fieldLabel}>Patient name (የታካሚ ስም)</Text>
          <TouchableOpacity
            onPress={() => {
              triggerSelectionHaptic();
              setIsAddProfileModalVisible(true);
            }}
            style={styles.addPatientChip}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color={THEME.colors.teal} />
            <Text style={styles.addPatientChipText}>+ New Profile</Text>
          </TouchableOpacity>
        </View>

        {profiles.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyProfilePrompt}
            onPress={() => {
              triggerSelectionHaptic();
              setIsAddProfileModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={20} color={THEME.colors.teal} />
            <Text style={styles.emptyProfilePromptText}>
              No profile added yet. Tap here to add yourself or a family member.
            </Text>
          </TouchableOpacity>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.profileRow}
          >
            {profiles.map((p) => {
              const isSelected = selectedProfileId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.profileChip,
                    isSelected && styles.profileChipSelected,
                  ]}
                  onPress={() => {
                    triggerSelectionHaptic();
                    setSelectedProfileId(p.id);
                  }}
                >
                  <Text
                    style={[
                      styles.profileChipText,
                      isSelected && styles.profileChipTextSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Medication Name */}
        <Text style={styles.fieldLabel}>Medication</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Paracetamol, Amlodipine"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        {/* Dosage */}
        <Text style={styles.fieldLabel}>Dosage</Text>
        <TextInput
          style={styles.textInput}
          placeholder="1 Tablet"
          placeholderTextColor="#94A3B8"
          value={dosage}
          onChangeText={setDosage}
        />

        {/* Food Timing */}
        <Text style={styles.fieldLabel}>Meal Relation</Text>
        <View style={styles.mealRow}>
          {MEAL_TIMINGS.map((timing) => {
            const isSelected = mealTiming === timing;
            return (
              <TouchableOpacity
                key={timing}
                style={[styles.mealBtn, isSelected && styles.mealBtnSelected]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setMealTiming(timing);
                }}
              >
                <Text
                  style={[
                    styles.mealBtnText,
                    isSelected && styles.mealBtnTextSelected,
                  ]}
                >
                  {t(`meal.${timing}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Intuitive Ethiopian Time Picker Dial */}
        <EthiopianTimePicker value={ethiopianTime} onChange={setEthiopianTime} />

        {/* Inventory Units */}
        <Text style={styles.fieldLabel}>Total Stock / Inventory (Pills)</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor="#94A3B8"
          value={stockCount}
          onChangeText={setStockCount}
        />

        {/* Bottom CTA Button: Add Now (Coral) */}
        <TouchableOpacity
          style={[styles.addNowBtn, (!name.trim() || !selectedProfileId) && styles.addNowBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || !selectedProfileId}
          activeOpacity={0.85}
        >
          <Text style={styles.addNowBtnText}>Add Now</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Patient Profile Modal */}
      <AddProfileModal
        visible={isAddProfileModalVisible}
        onClose={() => setIsAddProfileModalVisible(false)}
        onSave={async (newProfile) => {
          const created = await addProfile(newProfile);
          setSelectedProfileId(created.id);
          setIsAddProfileModalVisible(false);
        }}
      />
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  profileChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  profileChipSelected: {
    backgroundColor: THEME.colors.teal,
    borderColor: THEME.colors.tealDark,
  },
  profileChipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  profileChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: THEME.colors.textPrimary,
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealBtn: {
    flexBasis: '48%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  mealBtnSelected: {
    backgroundColor: THEME.colors.teal,
    borderColor: THEME.colors.teal,
  },
  mealBtnText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  mealBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addNowBtn: {
    backgroundColor: THEME.colors.coral,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: THEME.colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addNowBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addNowBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  patientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  addPatientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  addPatientChipText: {
    fontSize: 12,
    color: THEME.colors.tealDark,
    fontWeight: '700',
  },
  emptyProfilePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 10,
    marginBottom: 10,
  },
  emptyProfilePromptText: {
    fontSize: 13,
    color: THEME.colors.tealDark,
    fontWeight: '600',
    flex: 1,
  },
});
