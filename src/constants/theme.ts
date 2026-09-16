/**
 * Mədin Design System Theme Tokens
 * Matches the official "Mədin - Modern Medication Reminder App" UI
 */

export const THEME = {
  colors: {
    // Primary Brand Teal (Headers, Floating Action Buttons, Active Tabs)
    teal: '#3B9B94',
    tealDark: '#2F827C',
    tealLight: '#E8F5F4',
    tealSubtle: '#F0F8F7',

    // Action Coral (Taken buttons, Add Patient, Critical Alerts)
    coral: '#F26E56',
    coralDark: '#D95842',
    coralLight: '#FDECE9',

    // Snooze & Neutral Action Buttons
    snoozeBg: '#EDF2F4',
    snoozeText: '#475569',

    // Surfaces & Backgrounds
    canvas: '#F5F8F8',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#EDF2F7',

    // Typography
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textWhite: '#FFFFFF',

    // Status Dots
    takenGreen: '#3B9B94',
    missedCoral: '#F26E56',
  },
  typography: {
    fontDisplay: '700',
    fontSemiBold: '600',
    fontRegular: '400',
  },
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
  shadow: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    fab: {
      shadowColor: '#3B9B94',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};
