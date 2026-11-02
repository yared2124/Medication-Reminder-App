import { MMKV } from 'react-native-mmkv';

const preferences = new MMKV({ id: 'medication-reminder-preferences' });
const ACTIVE_PROFILE_KEY = 'active-profile-id';

export const preferenceStore = {
  getActiveProfileId(): string | null {
    return preferences.getString(ACTIVE_PROFILE_KEY) ?? null;
  },
  setActiveProfileId(profileId: string | null): void {
    if (profileId === null) {
      preferences.delete(ACTIVE_PROFILE_KEY);
    } else {
      preferences.set(ACTIVE_PROFILE_KEY, profileId);
    }
  },
};
