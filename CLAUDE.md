# CLAUDE.md - Ethiopian Local Time Medication Reminder App

Guidelines, architectural rules, and commands for developing the **Ethiopian Local Time Medication Reminder App (የመድሃኒት ማስታወሻ)**.

---

## 1. Project Overview & Tech Stack

An offline-first React Native mobile application bridging Ethiopian 12-hour cyclical diurnal time with Gregorian OS system scheduling, featuring multi-dependent profiles, high-priority notifications, and medication inventory tracking.

- **Framework:** React Native (TypeScript, Expo bare workflow / React Native CLI)
- **Language:** TypeScript (`strict: true`)
- **Alarm & Notification Engine:** `@notifee/react-native` (Exact alarms, full-screen intents, custom sound/vibration channels)
- **Local Relational Database:** SQLite (`react-native-quick-sqlite` or `op-sqlite`)
- **Key-Value Storage:** `react-native-mmkv` (Fast persistence for user settings and active profile ID)
- **State Management:** Zustand (Isolated slices for profiles, reminders, inventory, and logs)
- **Date & Math Utilities:** `date-fns` paired with custom Ethiopian time conversion utilities
- **Localization (i18n):** `i18next` + `react-i18next` (Amharic `am` primary, English `en` secondary)
- **Testing:** Jest + React Native Testing Library

---

## 2. Common Development Commands

### Environment Setup & Installation
```bash
# Install dependencies
npm install

# iOS pod installation (macOS)
cd ios && pod install && cd ..
```

### Running the App
```bash
# Start Metro bundler
npm start

# Run on Android emulator / connected device
npm run android

# Run on iOS simulator (macOS)
npm run ios
```

### Quality & Testing
```bash
# Type check TypeScript
npm run type-check   # tsc --noEmit

# Lint code
npm run lint         # eslint . --ext .js,.jsx,.ts,.tsx

# Format code
npm run format       # prettier --write "src/**/*.{ts,tsx,json,md}"

# Run tests
npm test             # jest
npm run test:watch   # jest --watch
npm run test:coverage# jest --coverage
```

---

## 3. Project Structure

```
Medication-Reminder-App/
├── android/                         # Android native project & manifest configurations
│   └── app/src/main/
│       ├── AndroidManifest.xml      # Exact alarm permissions & BootReceiver declarations
│       └── java/com/.../            # Native BootReceiver implementation
├── ios/                             # iOS native project
├── assets/
│   ├── fonts/                       # Custom Amharic/Ge'ez font assets (e.g., Noto Sans Ethiopic)
│   ├── sounds/                      # Custom alarm chimes
│   └── icons/                       # App icons & badges
├── src/
│   ├── components/                  # Reusable UI presentation components
│   │   ├── common/                  # Buttons, Cards, Inputs, Modals, Typography
│   │   ├── dependent/               # ProfileAvatar, DependentBadge, ProfileSwitcher
│   │   ├── medication/              # MedicationCard, DosageBadge, StockIndicator
│   │   └── time-picker/             # EthiopianTimePicker, DiurnalSegmentSelector
│   ├── screens/                     # Application screens / navigation views
│   │   ├── dashboard/               # Today's schedule & active dependent view
│   │   ├── medication/              # Add/Edit medication schedule flow
│   │   ├── profiles/                # Manage dependent profiles
│   │   ├── history/                 # Adherence logs & stats
│   │   └── settings/                # Alarm volume, language toggle, backup
│   ├── navigation/                  # React Navigation stack & tab definitions
│   ├── services/                    # Background & native hardware abstractions
│   │   ├── notifications/           # Notifee notification triggers, categories & channels
│   │   ├── alarm/                   # Exact alarm scheduling & boot restoration logic
│   │   └── database/                # SQLite connection, migrations, and repositories
│   │       ├── schema.ts            # Database schema definitions
│   │       └── repositories/        # profileRepo, medicationRepo, logRepo
│   ├── store/                       # Zustand store slices
│   │   ├── useProfileStore.ts
│   │   ├── useMedicationStore.ts
│   │   └── useSettingsStore.ts
│   ├── utils/                       # Pure functions & domain logic
│   │   ├── ethiopianTime.ts         # Ethiopian ↔ Gregorian conversion algorithms
│   │   ├── dateUtils.ts             # Date-fns helpers and epoch formatters
│   │   └── validation.ts            # Input validation schemas
│   ├── constants/                   # Static enums, colors, diurnal segment constants
│   ├── i18n/                        # Amharic and English translation files
│   │   ├── locales/
│   │   │   ├── am.json              # አማርኛ strings
│   │   │   └── en.json              # English strings
│   │   └── index.ts                 # i18next configuration
│   └── types/                       # Global TypeScript declarations
│       ├── models.ts                # Profile, Medication, Schedule, Log interfaces
│       ├── navigation.ts            # Navigation route params
│       └── ethiopianTime.ts         # DiurnalPeriod types, EthiopianTime interface
├── App.tsx                          # Root application entry point & providers
├── index.js                         # React Native headless background task register
├── PRD.md                           # Product Requirements Document
├── CLAUDE.md                        # Project instructions and conventions
├── package.json
└── tsconfig.json
```

---

## 4. Code Style & Conventions

### 4.1 TypeScript & Typing
- Enable strict mode (`"strict": true` in `tsconfig.json`).
- Avoid `any`. Use `unknown` with type guards if types are indeterminate.
- Keep domain models in `src/types/models.ts`.
- Prefer `interface` for entity declarations and `type` for unions/aliases.

```typescript
// Example: Strict types for Ethiopian Time
export type DiurnalPeriod = 'TEWAT' | 'KESEAT' | 'MATA' | 'LELIT';

export interface EthiopianTime {
  hour: number;        // 1 to 12
  minute: number;      // 0 to 59
  period: DiurnalPeriod;
}
```

### 4.2 Naming Conventions
- **Files & Folders:**
  - Components: PascalCase (e.g., `EthiopianTimePicker.tsx`, `MedicationCard.tsx`).
  - Utilities/Services/Stores: camelCase (e.g., `ethiopianTime.ts`, `useProfileStore.ts`).
  - Types: camelCase or PascalCase ending in `.types.ts` or `types/models.ts`.
- **Variables & Functions:**
  - Standard variables & functions: camelCase (e.g., `convertToGregorianTime`, `activePatientId`).
  - Constants & Enums: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_SNOOZE_MINUTES`, `ETHIOPIAN_HOUR_OFFSET`).
  - React Components: PascalCase (e.g., `ProfileAvatar`).

### 4.3 Architecture & Component Principles
- **Separation of Concerns:** Keep UI components presentational. Move business logic, calculations, and database calls into custom hooks (`hooks/`) or services (`services/`).
- **Offline-First:** All UI mutations write to local SQLite/MMKV first. No UI block waiting on remote networks.
- **Pure Functions for Time Calculations:** Keep `ethiopianTime.ts` 100% pure, deterministic, and free of UI/storage side-effects to enable thorough unit testing.

---

## 5. Critical Domain & Hardware Best Practices

### 5.1 Ethiopian Time Conversion Math
Ethiopian time operates in 12-hour segments anchored to sunrise (12:00 ጠዋት = 06:00 UTC+3):
- **ጠዋት (Morning):** $Offset = 6$ ($12 \rightarrow 6\text{ AM}, 1 \rightarrow 7\text{ AM}, \dots, 5 \rightarrow 11\text{ AM}$)
- **ከሰዓት (Afternoon):** $Offset = 6$ ($6 \rightarrow 12\text{ PM}, 7 \rightarrow 1\text{ PM}, \dots, 11 \rightarrow 5\text{ PM}$)
- **ማታ (Evening):** $Offset = 18$ ($12 \rightarrow 6\text{ PM}, 1 \rightarrow 7\text{ PM}, \dots, 5 \rightarrow 11\text{ PM}$)
- **ሌሊት (Night):** $Offset = 18$ ($6 \rightarrow 12\text{ AM}, 7 \rightarrow 1\text{ AM}, \dots, 11 \rightarrow 5\text{ AM}$)

**Rule:** Always convert Ethiopian input directly to standard UTC timestamps when saving schedules in the database. Never store localized text strings as trigger times.

### 5.2 Battery Optimization & Alarm Reliability (Android)
- **Exact Alarms:** Must use `@notifee/react-native` with `createTriggerNotification` using `TriggerType.TIMESTAMP` and `alarmManager: { allowWhileIdle: true }`.
- **Permissions:** Ensure AndroidManifest includes:
  ```xml
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  ```
- **Device Reboot (`BOOT_COMPLETED`):**
  Android clears scheduled `AlarmManager` alarms when the device reboots. A native `BroadcastReceiver` or Notifee background event listener must query the SQLite database and reschedule all future active alarms upon restart.

### 5.3 Notification Action Handlers
- Notification actions (`ወሰድኩ / Taken`, `አዘግይ / Snooze`, `ዝለል / Skip`) must be handled inside Notifee's `onBackgroundEvent` registered in `index.js` (outside React component lifecycles) to guarantee execution even when the app is closed.
- When "Taken" is received, immediately update SQLite to decrement inventory and log adherence.

### 5.4 Localization & Accessibility
- Never hardcode user-facing strings in JSX. Always use `t('key')` from `react-i18next`.
- Primary translation language is **Amharic (አማርኛ)**.
- Ensure font sizes and UI layout accommodate Ethiopic characters without truncating text or overflowing buttons.

---

## 6. Definition of Done (DoD)

Before any PR or feature is considered complete:
1. `npm run type-check` passes with zero errors.
2. `npm run lint` passes without warnings.
3. Unit tests added for any new time conversion or business logic in `src/utils/`.
4. Feature verified on an Android emulator or device with screen locked and app in background.
5. All UI copy supports both Amharic and English localization.
