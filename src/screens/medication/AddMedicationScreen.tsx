import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { EthiopianTimePicker } from '../../components/time-picker/EthiopianTimePicker';
import { EthiopianTime } from '../../types/ethiopianTime';
import { MealTiming } from '../../types/models';
import { t } from '../../i18n';

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

export const AddMedicationScreen: React.FC<AddMedicationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { profiles, activeProfileId, addMedicationWithSchedule } = useAppStore();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    activeProfileId || (profiles[0]?.id ?? '')
  );
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 ኪኒን');
  const [mealTiming, setMealTiming] = useState<MealTiming>('AFTER_MEAL');
  const [stockCount, setStockCount] = useState('30');
  const [ethiopianTime, setEthiopianTime] = useState<EthiopianTime>({
    hour: 2,
    minute: 0,
    period: 'TEWAT', // 02:00 ጠዋት = 8:00 AM
  });

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('ስህተት', 'እባክዎ የመድሃኒቱን ስም ያስገቡ።');
      return;
    }

    if (!selectedProfileId) {
      Alert.alert('ስህተት', 'እባክዎ መጀመሪያ የታካሚ መገለጫ ይምረጡ ወይም ይፍጠሩ።');
      return;
    }

    const parsedStock = parseInt(stockCount, 10) || 0;

    await addMedicationWithSchedule(
      {
        profileId: selectedProfileId,
        name: name.trim(),
        dosage: dosage.trim() || '1 ኪኒን',
        dosageAmount: 1,
        mealTiming,
        stockCount: parsedStock,
        lowStockThreshold: 6, // 3 days for 2x daily or 6 days for 1x
      },
      ethiopianTime
    );

    onSuccess();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('medication.add_title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Selector */}
        <Text style={styles.fieldLabel}>ለማን ይሰጣል? (Patient / Dependent)</Text>
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
                  isSelected && { backgroundColor: p.color, borderColor: p.color },
                ]}
                onPress={() => setSelectedProfileId(p.id)}
              >
                <Text
                  style={[
                    styles.profileChipText,
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Medication Name */}
        <Text style={styles.fieldLabel}>{t('medication.name_label')} *</Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('medication.name_placeholder')}
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        {/* Dosage */}
        <Text style={styles.fieldLabel}>{t('medication.dosage_label')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('medication.dosage_placeholder')}
          placeholderTextColor="#94A3B8"
          value={dosage}
          onChangeText={setDosage}
        />

        {/* Meal Instruction */}
        <Text style={styles.fieldLabel}>{t('medication.meal_label')}</Text>
        <View style={styles.mealRow}>
          {MEAL_TIMINGS.map((timing) => {
            const isSelected = mealTiming === timing;
            return (
              <TouchableOpacity
                key={timing}
                style={[styles.mealButton, isSelected && styles.mealButtonSelected]}
                onPress={() => setMealTiming(timing)}
              >
                <Text
                  style={[
                    styles.mealButtonText,
                    isSelected && styles.mealButtonTextSelected,
                  ]}
                >
                  {t(`meal.${timing}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ethiopian Time Picker */}
        <EthiopianTimePicker value={ethiopianTime} onChange={setEthiopianTime} />

        {/* Stock Inventory */}
        <Text style={styles.fieldLabel}>{t('medication.stock_label')}</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor="#94A3B8"
          value={stockCount}
          onChangeText={setStockCount}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
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
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  profileChipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealButton: {
    flexBasis: '48%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  mealButtonSelected: {
    backgroundColor: '#1E293B',
    borderColor: '#0F172A',
  },
  mealButtonText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  mealButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
