# 💊 Mədin (የመድሃኒት ማስታወሻ)

> **Culturally Tailored Ethiopian Local Time Medication Reminder & Adherence Mobile App**  
> Built with **React Native (Expo SDK 57)**, **TypeScript**, and an **Offline-First** engine.

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?style=flat&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86.3-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%206.0-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Jest%20Tests-24%2F24%20Passing-brightgreen.svg?style=flat&logo=jest)](https://jestjs.io)
[![License](https://img.shields.io/badge/License-MIT-teal.svg?style=flat)](#license)

---

## 🌟 Overview

**Mədin** is a mobile health app designed specifically for Ethiopian households and elderly patients. Unlike standard Western alarm applications that rely strictly on 24-hour UTC or 12-hour AM/PM cycles, **Mədin** operates on the authentic **Ethiopian 12-Hour Solar Diurnal Cycle**:

- 🌅 **ጠዋት (Tewat / Morning)**: 12:00 to 05:59 (6:00 AM – 11:59 AM Gregorian)
- ☀️ **ከሰዓት (Kese'at / Afternoon)**: 06:00 to 11:59 (12:00 PM – 5:59 PM Gregorian)
- 🌆 **ማታ (Mata / Evening)**: 12:00 to 05:59 (6:00 PM – 11:59 PM Gregorian)
- 🌙 **ሌሊት (Lelit / Night)**: 06:00 to 11:59 (12:00 AM – 5:59 AM Gregorian)

---

## ✨ Key Features

### 1. ⏰ Intuitive Ethiopian Time Engine
- **Culturally aligned dial**: Select hours according to Ethiopian daylight/night phases.
- **Real-time Gregorian Preview**: Instantly shows the converted system time (e.g., `ጠዋት 02:00` ➔ `8:00 AM`).
- **Exact Alarms & Triggers**: Converts Ethiopian times to milliseconds for exact system alarms.

### 2. 👨‍👩‍👧‍👦 Multi-Dependent Family Care
- **Manage multiple individuals** in one household (e.g., Self, Mother, Father, Children).
- **Patient-Specific History**: Filter adherence calendars and medication intake history per individual.
- **Color Identity**: Distinct customizable avatars for easy visual recognition.

### 3. 🔊 Native Offline Amharic Voice Prompts
- Designed for **elderly or low-literacy patients** who struggle to read small text or notifications.
- Speaks natural Amharic audio cues:
  - *«ያሬድ ሆይ! የአምሎዲፒን መድሃኒትዎን የሚወስዱበት ሰዓት ደርሷል...»* (Reminder Audio)
  - *«መድሃኒትዎን በትክክል ወስደዋል፣ ጤና ይስጥልኝ!»* (Taken Confirmation)
  - *«ማስጠንቀቂያ፦ የመድሃኒት ክምችትዎ እያለቀ ነው...»* (Low Stock Warning)
- Powered by `expo-audio` with bundled native voice assets — works **100% offline without internet**.

### 4. 📊 Adherence Tracking & History Management
- **Monthly Calendar Grid**: Visual dot markers showing taken vs missed doses.
- **Patient Filter Chips**: Tap to view history for *All Patients* or a specific family member (e.g., Samuel, Kidist).
- **Reset to Zero (አጽዳ 🗑️)**: Clear intake history data with one-tap confirmation to restart records.

### 5. 📦 Stock & Inventory Control
- Track pill counts and set low-stock thresholds.
- **Quick Refill Modal**: Tap presets (+10, +30, +60 pills) to restock inventories.

### 6. 🎨 Premium Mədin Design System
- **Brand Palette**: Primary Teal (`#3B9B94`) & Energetic Coral/Orange (`#F26E56`).
- **Vector Icons**: Replaced all device-dependent emojis with crisp vector icons from `@expo/vector-icons` (`Ionicons`, `MaterialCommunityIcons`).
- **Bilingual Interface**: Seamless switching between Amharic (አማርኛ) and English.

---

## 📱 Screenshots & UI Architecture

| Home Dashboard | Add Medication | Ethiopian Time Dial | History & Adherence |
| :---: | :---: | :---: | :---: |
| Overview of daily schedules | Patient chips & meal relations | Diurnal period selection | Multi-dependent calendar |

---

## 📂 Project Structure

```text
Medication-Reminder-App/
├── App.tsx                          # Root application & main tab router
├── app.json                         # Expo application configuration & assets
├── tsconfig.json                    # TypeScript strict mode configuration
├── jest.config.js                   # Jest unit testing configuration
│
├── assets/
│   ├── audio/                       # Bundled offline Amharic voice files (.mp3)
│   │   ├── reminder_amharic.mp3
│   │   ├── taken_amharic.mp3
│   │   └── low_stock_amharic.mp3
│   └── fonts/                       # Custom typography assets
│
├── src/
│   ├── components/
│   │   ├── dependent/               # ProfileSwitcher, AddProfileModal
│   │   ├── medication/              # MedicationCard, RefillStockModal
│   │   ├── navigation/              # BottomTabBar (Teal FAB), SideMenuDrawer
│   │   ├── notifications/           # AlarmModal (Full-screen alarm overlay)
│   │   └── time-picker/             # EthiopianTimePicker (Diurnal period dial)
│   │
│   ├── constants/
│   │   └── theme.ts                 # Centralized color tokens, shadows & typography
│   │
│   ├── i18n/                        # Amharic & English translations
│   │   ├── locales/
│   │   │   ├── am.json              # Amharic strings
│   │   │   └── en.json              # English strings
│   │   └── index.ts
│   │
│   ├── screens/
│   │   ├── dashboard/               # DashboardScreen (Daily medication cards)
│   │   ├── history/                 # HistoryScreen (Patient filter & calendar)
│   │   ├── medication/              # AddMedicationScreen (Ethiopian time form)
│   │   └── profiles/                # ProfilesScreen (Patient management)
│   │
│   ├── services/
│   │   ├── alarm/                   # Alarm scheduler & exact trigger calculations
│   │   ├── audio/                   # VoiceService (expo-audio & Speech fallback)
│   │   └── database/                # Repository pattern (In-memory & persistence)
│   │
│   ├── store/
│   │   └── useAppStore.ts           # Zustand global state store
│   │
│   ├── types/
│   │   ├── ethiopianTime.ts         # Types for Tewat, Kese'at, Mata, Lelit
│   │   └── models.ts                # Profile, Medication, Schedule, IntakeLog
│   │
│   └── utils/
│       ├── ethiopianTime.ts         # Bidirectional time conversion algorithms
│       └── haptics.ts               # Tactile haptic feedback triggers
│
└── __tests__/
    ├── alarmService.test.ts         # Alarm calculation & trigger tests
    ├── ethiopianTime.test.ts        # Time conversion & boundary validation tests
    └── historyAndRepository.test.ts # Multi-dependent filtering & reset tests
```

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: [Expo SDK 57](https://expo.dev) with React Native 0.86.3
- **Language**: TypeScript 6.0 (Strict mode enabled)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Audio Playback**: `expo-audio` (Modern native audio playback)
- **Icons**: `@expo/vector-icons` (`Ionicons`, `MaterialCommunityIcons`)
- **Haptics**: `expo-haptics`
- **Testing**: Jest 29 + `ts-jest`

---

## 🚀 Quick Start Guide

### Prerequisites

Make sure you have installed:
1. **Node.js**: v18.x or higher (`node -v`)
2. **npm** or **yarn**
3. **Git**
4. **Expo Go** app installed on your Android (via Google Play) or iOS (via App Store) device.

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/yared2124/Medication-Reminder-App.git
cd Medication-Reminder-App
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start the Development Server

For local network or remote connection with Tunnel:

```bash
# Recommended for physical mobile phones:
npx expo start --tunnel -c

# Or standard LAN mode:
npx expo start
```

### Step 4: Open on Your Phone

1. Open the **Expo Go** application on your smartphone.
2. **Scan the QR Code** displayed in your terminal.
3. If using tunnel or remote connection, paste the `exp://...` URL directly into Expo Go.

> 💡 **Developer Tip**:
> - Press **`r`** in the terminal to quickly reload the app on your phone.
> - Press **`m`** to toggle the Expo Developer Menu.

---

## 🧪 Running Unit Tests

The project includes an automated test suite verifying:
- Bidirectional conversions between Ethiopian Local Time and Gregorian System Time.
- Diurnal period boundaries (`TEWAT`, `KESEAT`, `MATA`, `LELIT`).
- Exact alarm trigger timing (today vs tomorrow offsets).
- Multi-dependent history logs filtering and data clearing.

To run all tests:

```bash
npm test
```

Expected output:
```text
PASS __tests__/historyAndRepository.test.ts
PASS __tests__/alarmService.test.ts
PASS __tests__/ethiopianTime.test.ts

Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        ~6.8 s
Ran all test suites.
```

To run TypeScript type-checks:

```bash
npx tsc --noEmit
```

---

## 🕰️ Ethiopian Time Conversion Reference

| Ethiopian Period | Ethiopian Hour | Gregorian Time | Description |
| :--- | :---: | :---: | :--- |
| **ጠዋት (Morning)** | 12:00 | 06:00 AM | Sunrise / Dawn |
| **ጠዋት (Morning)** | 01:00 | 07:00 AM | Early Morning |
| **ጠዋት (Morning)** | 02:00 | 08:00 AM | Morning Medication |
| **ጠዋት (Morning)** | 05:59 | 11:59 AM | End of Morning |
| **ከሰዓት (Afternoon)** | 06:00 | 12:00 PM | Midday / Lunch |
| **ከሰዓት (Afternoon)** | 08:30 | 02:30 PM | Afternoon Dose |
| **ማታ (Evening)** | 12:00 | 06:00 PM | Sunset / Dinner |
| **ማታ (Evening)** | 02:00 | 08:00 PM | Evening Dose |
| **ሌሊት (Night)** | 06:00 | 12:00 AM | Midnight |
| **ሌሊት (Night)** | 10:00 | 04:00 AM | Early Dawn |

---

## 🤝 Contributing

Contributions are warmly welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Developed By

**Yared** ([@yared2124](https://github.com/yared2124))  
*Empowering health and adherence through culturally native technology.*
