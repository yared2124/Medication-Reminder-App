import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerSelectionHaptic } from '../../utils/haptics';
import { voiceService } from '../../services/audio/voiceService';
import { i18n } from '../../i18n';

interface SideMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'HOME' | 'HISTORY' | 'PROFILES' | 'ADD_MEDICATION') => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const currentLang = i18n.getLanguage();

  const handleSelectScreen = (screen: 'HOME' | 'HISTORY' | 'PROFILES' | 'ADD_MEDICATION') => {
    triggerSelectionHaptic();
    onNavigate(screen);
    onClose();
  };

  const handleToggleLanguage = () => {
    triggerSelectionHaptic();
    const newLang = currentLang === 'am' ? 'en' : 'am';
    i18n.setLanguage(newLang);
    onClose();
  };

  const handleTestVoice = () => {
    triggerSelectionHaptic();
    voiceService.speakReminder();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <View style={styles.brandLogo}>
                <MaterialCommunityIcons name="pill" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.brandTitle}>Mədin</Text>
                <Text style={styles.brandSub}>የመድሃኒት ማስታወሻ</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            {/* 1. Home */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectScreen('HOME')}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={20} color={THEME.colors.teal} style={{ marginRight: 14 }} />
              <Text style={styles.menuLabel}>Home (ዋና ገጽ)</Text>
            </TouchableOpacity>

            {/* 2. History */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectScreen('HISTORY')}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={THEME.colors.teal} style={{ marginRight: 14 }} />
              <Text style={styles.menuLabel}>History & Adherence (የአወሳሰድ ታሪክ)</Text>
            </TouchableOpacity>

            {/* 3. Profiles */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectScreen('PROFILES')}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={20} color={THEME.colors.teal} style={{ marginRight: 14 }} />
              <Text style={styles.menuLabel}>Patient Profiles (የታካሚ መገለጫዎች)</Text>
            </TouchableOpacity>

            {/* 4. Add Schedule */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectScreen('ADD_MEDICATION')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={THEME.colors.coral} style={{ marginRight: 14 }} />
              <Text style={styles.menuLabel}>Add Medication (አዲስ መዝግብ)</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 5. Voice Audio Test */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleTestVoice}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high-outline" size={20} color={THEME.colors.teal} style={{ marginRight: 14 }} />
              <Text style={styles.menuLabel}>Test Voice Audio (ድምፅ ፈትን)</Text>
            </TouchableOpacity>

            {/* 6. Language Switcher */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleToggleLanguage}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={20} color={THEME.colors.teal} style={{ marginRight: 14 }} />
              <View style={styles.langRow}>
                <Text style={styles.menuLabel}>Language / ቋንቋ</Text>
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>
                    {currentLang === 'am' ? 'አማርኛ' : 'English'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Mədin v1.0.0 • 100% Offline</Text>
            <Text style={styles.footerSubText}>Ethiopian Diurnal Time Engine</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawerContainer: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#EBF1F1',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  brandSub: {
    fontSize: 11,
    color: THEME.colors.tealDark,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    fontSize: 20,
    width: 28,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBF1F1',
    marginVertical: 12,
  },
  langRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langBadge: {
    backgroundColor: THEME.colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.tealDark,
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: '#EBF1F1',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  footerSubText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
