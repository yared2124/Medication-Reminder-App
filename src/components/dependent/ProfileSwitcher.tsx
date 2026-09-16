import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Profile } from '../../types/models';
import { t } from '../../i18n';

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelectProfile: (id: string | null) => void;
  onAddProfile?: () => void;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "All" button */}
        <TouchableOpacity
          style={[styles.chip, activeProfileId === null && styles.chipActive]}
          onPress={() => onSelectProfile(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.chipText, activeProfileId === null && styles.chipTextActive]}
          >
            {t('common.all')}
          </Text>
        </TouchableOpacity>

        {/* Individual profiles */}
        {profiles.map((profile) => {
          const isActive = activeProfileId === profile.id;
          return (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.chip,
                isActive && { backgroundColor: profile.color, borderColor: profile.color },
              ]}
              onPress={() => onSelectProfile(profile.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.avatarDot,
                  { backgroundColor: isActive ? '#FFFFFF' : profile.color },
                ]}
              />
              <Text
                style={[
                  styles.chipText,
                  isActive && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                {profile.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add Profile button */}
        {onAddProfile && (
          <TouchableOpacity
            style={styles.addChip}
            onPress={onAddProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.addChipText}>+ {t('profile.add')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  addChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
