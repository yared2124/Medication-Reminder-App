import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { triggerSelectionHaptic } from '../../utils/haptics';

export type TabType = 'HOME' | 'HISTORY' | 'PROFILES' | 'ALERTS';

interface BottomTabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onPressAdd: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onPressAdd,
}) => {
  const handleTabPress = (tab: TabType) => {
    triggerSelectionHaptic();
    onSelectTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {/* 1. Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress('HOME')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'HOME' && styles.tabIconActive]}>
            🏠
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'HOME' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. History / Calendar */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress('HISTORY')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'HISTORY' && styles.tabIconActive]}>
            📅
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'HISTORY' && styles.tabLabelActive]}>
            History
          </Text>
        </TouchableOpacity>

        {/* 3. Center Elevated FAB (+) */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              triggerSelectionHaptic();
              onPressAdd();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Alerts / Voice */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress('ALERTS')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'ALERTS' && styles.tabIconActive]}>
            🔔
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'ALERTS' && styles.tabLabelActive]}>
            Alerts
          </Text>
        </TouchableOpacity>

        {/* 5. Profiles / Patients */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress('PROFILES')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'PROFILES' && styles.tabIconActive]}>
            👤
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'PROFILES' && styles.tabLabelActive]}>
            Profiles
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EBF1F1',
  },
  bar: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 20,
    color: THEME.colors.textMuted,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: THEME.colors.teal,
    fontWeight: '700',
  },
  fabContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 12,
    ...THEME.shadow.fab,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 30,
  },
});
