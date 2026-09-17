import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { AddProfileModal } from '../../components/dependent/AddProfileModal';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerSelectionHaptic } from '../../utils/haptics';

interface ProfilesScreenProps {
  onSelectProfile?: (id: string) => void;
}

export const ProfilesScreen: React.FC<ProfilesScreenProps> = ({ onSelectProfile }) => {
  const { profiles, addProfile, activeProfileId, setActiveProfileId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProfile = async (profileData: {
    name: string;
    relationship: string;
    color: string;
    age?: number;
    emergencyContact?: string;
  }) => {
    const created = await addProfile(profileData);
    setActiveProfileId(created.id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.teal} />

      {/* Teal Header */}
      <View style={styles.tealHeader}>
        <Text style={styles.headerTitle}>Profiles</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>Patient Info</Text>

        {/* Patients List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = activeProfileId === item.id;
            return (
              <TouchableOpacity
                style={[styles.patientCard, isSelected && styles.patientCardSelected]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setActiveProfileId(item.id);
                  onSelectProfile?.(item.id);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: item.color }]}>
                  <Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.healthInfoText}>
                    {item.relationship ?? 'Dependent'} {item.age ? `• ${item.age} yrs` : ''}
                    {item.emergencyContact ? ` • ${item.emergencyContact}` : ''}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            );
          }}
        />

        {/* Bottom CTA Button: Add Patient */}
        <TouchableOpacity
          style={styles.addPatientBtn}
          onPress={() => {
            triggerSelectionHaptic();
            setIsAddModalOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addPatientBtnText}>Add Patient</Text>
        </TouchableOpacity>
      </View>

      <AddProfileModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateProfile}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.colors.textPrimary,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 80,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBF1F1',
    ...THEME.shadow.card,
  },
  patientCardSelected: {
    borderColor: THEME.colors.teal,
    borderWidth: 1.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  healthInfoText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: '#CBD5E1',
    paddingLeft: 8,
  },
  addPatientBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: THEME.colors.coral,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: THEME.colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addPatientBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
