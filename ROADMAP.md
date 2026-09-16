# Master Roadmap & Task Breakdown

**Project:** Ethiopian Local Time Medication Reminder App (የመድሃኒት ማስታወሻ)  
**Target:** MVP to Production Release  
**Architecture:** React Native + TypeScript + SQLite + Notifee  
**Primary Language:** Amharic (UI) / English (Code)  

---

## Roadmap Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     PHASE 0     │ ──► │     PHASE 1     │ ──► │     PHASE 2     │ ──► │     PHASE 3     │
│ Architecture &  │     │ Ethiopian Time  │     │ Hardware Alarms │     │ Core MVP Flow   │
│ Foundation      │     │  & Math Engine  │     │   & Notifee     │     │   (Single User) │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                 │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐              ▼
│     PHASE 7     │ ◄── │     PHASE 6     │ ◄── │     PHASE 5     │ ◄── ┌─────────────────┐
│ Production Prep │     │ Accessibility & │     │ Inventory &     │     │     PHASE 4     │
│ & Store Release │     │ OEM Hardening   │     │ Adherence Stats │     │ Multi-Dependent │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Phase 0: Architecture & Foundation Setup

**Objective:** Establish a rock-solid, type-safe, and offline-first base repository.

### Milestone 0 Deliverable
- Clean project compiling on Android and iOS with SQLite and MMKV operational.

### Tasks
- [ ] **Task 0.1: Scaffolding & Tooling**
  - Initialize React Native project with TypeScript (`strict: true`).
  - Configure ESLint, Prettier, and Husky pre-commit hooks.
  - Setup Jest configuration with `@testing-library/react-native`.
- [ ] **Task 0.2: Native Permissions Configuration**
  - Android: Configure `AndroidManifest.xml` with:
    - `SCHEDULE_EXACT_ALARM`
    - `USE_EXACT_ALARM`
    - `WAKE_LOCK`
    - `RECEIVE_BOOT_COMPLETED`
    - `VIBRATE`
  - iOS: Add user notification capability and background fetch entitlements.
- [ ] **Task 0.3: Database & Local Persistence Layer**
  - Setup SQLite (`react-native-quick-sqlite` or `op-sqlite`).
  - Create database schema migrations:
    - `profiles` table (id, name, avatar, age, emergency_contact, created_at)
    - `medications` table (id, profile_id, name, dosage, meal_timing, stock_count, low_stock_threshold)
    - `schedules` table (id, medication_id, ethiopian_hour, ethiopian_minute, diurnal_period, gregorian_utc_timestamp, recurrence_type, is_active)
    - `intake_logs` table (id, schedule_id, medication_id, profile_id, scheduled_time, actual_time, status, reason)
  - Configure `react-native-mmkv` for synchronous settings storage.
- [ ] **Task 0.4: Localization (i18n) Foundation**
  - Configure `i18next` and `react-i18next`.
  - Create locale JSON structure for Amharic (`locales/am.json`) and English (`locales/en.json`).
  - Integrate Ethiopic font assets (e.g. *Noto Sans Ethiopic*) for crisp Amharic typography.

---

## Phase 1: Ethiopian Time & Conversion Engine

**Objective:** Build a 100% pure, deterministic conversion utility bridging Ethiopian diurnal time with Gregorian timestamps.

### Milestone 1 Deliverable
- Fully unit-tested `ethiopianTime.ts` module handling all edge cases, conversions, and Amharic text formatting.

### Tasks
- [ ] **Task 1.1: Core Conversion Formulas**
  - Implement `convertToGregorian(ethiopianTime: EthiopianTime, targetDate: Date): Date`.
    - ጠዋት (Morning: 12:00 – 05:59) $\rightarrow$ Offset +6
    - ከሰዓት (Afternoon: 06:00 – 11:59) $\rightarrow$ Offset +6
    - ማታ (Evening: 12:00 – 05:59) $\rightarrow$ Offset +18
    - ሌሊት (Night: 06:00 – 11:59) $\rightarrow$ Offset +18
  - Implement `convertToEthiopian(gregorianDate: Date): EthiopianTime`.
- [ ] **Task 1.2: Formatting & Localization Utilities**
  - Build `formatEthiopianTime(time: EthiopianTime, lang: 'am' | 'en'): string`.
    - E.g. Output: `"ጠዋት 02:30"` or `"Morning 02:30"`.
  - Provide next-occurrence calculator: `getNextScheduledOccurrence(time: EthiopianTime, recurrence: RecurrencePattern): Date`.
- [ ] **Task 1.3: Comprehensive Unit Testing**
  - Test noon crossover (12:00 ከሰዓት).
  - Test midnight crossover (06:00 ሌሊት $\rightarrow$ 00:00 UTC).
  - Test sunrise transition (12:00 ጠዋት $\rightarrow$ 06:00 UTC).
  - Test sunset transition (12:00 ማታ $\rightarrow$ 18:00 UTC).
  - Target: **100% test branch coverage** on time calculations.

---

## Phase 2: Hardware Alarm & Notification Engine

**Objective:** Ensure alarms ring with exact precision, high volume, and full battery-saver / reboot resilience.

### Milestone 2 Deliverable
- Reliable alarm triggers firing in Doze mode with background action buttons (*ወሰድኩ*, *አዘግይ*, *ዝለል*).

### Tasks
- [ ] **Task 2.1: Notifee Exact Alarm Setup**
  - Create dedicated Android notification channel with `Importance.HIGH` and custom audio chimes.
  - Implement `scheduleExactAlarm(scheduleId: string, timestamp: number, payload: AlarmPayload)`.
  - Use `TriggerType.TIMESTAMP` with `alarmManager: { allowWhileIdle: true }`.
- [ ] **Task 2.2: Actionable Notification Buttons**
  - Implement 3 action buttons:
    1. **ወሰድኩ (Taken):** Logs intake, decrements stock.
    2. **አዘግይ (Snooze):** Triggers re-alarm in 5/10/15 minutes.
    3. **ዝለል (Skip):** Flags dose as skipped; does not touch stock.
  - Register headless background handler in `index.js` via `notifee.onBackgroundEvent`.
- [ ] **Task 2.3: Device Reboot Resilience (`BOOT_COMPLETED`)**
  - Create Android native `BootReceiver` or configure Notifee's background event recovery.
  - Query SQLite on boot to re-schedule all active future alarms.
  - Add test harness to simulate device reboot (`adb shell am broadcast -a android.intent.action.BOOT_COMPLETED`).

---

## Phase 3: Core MVP User Flow (Single Profile)

**Objective:** Deliver an end-to-end working MVP where a user can add a medication schedule and respond to reminders.

### Milestone 3 Deliverable (MVP Release)
- Working app capable of setting reminders using the custom Ethiopian time dial and receiving alerts.

### Tasks
- [ ] **Task 3.1: Custom Ethiopian Time Picker Component**
  - Build intuitive selector for the 4 diurnal segments (ጠዋት / ከሰዓት / ማታ / ሌሊት).
  - Build circular or scrollable 12-hour clock selector (12:00 – 11:59).
  - Real-time preview card displaying Gregorian equivalent (e.g., *"ጠዋት 02:00 = 8:00 AM"*).
- [ ] **Task 3.2: Medication Creation & Edit Screen**
  - Inputs: Medication name, dosage unit, food relation (*ከምግብ በፊት*, *ከምግብ በኋላ*, *ከምግብ ጋር*).
  - Time input integrated with the custom Ethiopian picker.
  - Initial inventory count field.
  - Form validation with clear Amharic error prompts.
- [ ] **Task 3.3: Dashboard (Today's Doses)**
  - Visual cards for today's medications ordered chronologically in Ethiopian time.
  - Card status indicators: Pending, Taken, Snoozed, Missed.
  - Quick action buttons directly on the cards.
- [ ] **Task 3.4: In-App Full-Screen Alarm Modal**
  - High-visibility popup triggered when the alarm fires while the app is in the foreground.

---

## Phase 4: Multi-Dependent & Caregiver Management (v1.1)

**Objective:** Enable caregivers to manage multiple dependents (e.g. Self, Mother, Child) seamlessly.

### Milestone 4 Deliverable
- Multi-dependent profiles with personalized alarms and dashboard filtering.

### Tasks
- [ ] **Task 4.1: Profile Management CRUD**
  - Add profile screen (Name, relationship, avatar/color tag, emergency contact number).
  - Switch active profile or view "All Dependents" consolidated feed.
- [ ] **Task 4.2: Profile-Aware Medication Architecture**
  - Associate medications and schedules with specific `profile_id`.
  - Filter dashboard and logs dynamically based on the selected profile.
- [ ] **Task 4.3: Personalized Amharic Notifications**
  - Incorporate patient name in notification titles:
    > *"ያሬድ፣ የደም ግፊት መድሃኒት (1 ኪኒን - ከምግብ በኋላ) መውሰጃ ሰዓት ደርሷል!"*

---

## Phase 5: Inventory Depletion & Adherence Tracking (v1.2)

**Objective:** Provide chronic patients and caregivers with visibility into compliance and stock levels.

### Milestone 5 Deliverable
- Automated low-stock push notifications ($\le 3$ days) and visual compliance calendar.

### Tasks
- [ ] **Task 5.1: Real-Time Stock Decrement & Refill**
  - Atomically decrement stock when "ወሰድኩ" (Taken) action is pressed.
  - Prevent negative counts; add one-tap "Refill / ሙላ" dialog.
- [ ] **Task 5.2: Low Inventory Alerts**
  - Calculate daily consumption rate per medication.
  - Automatically fire push warning when remaining stock $\le 3$ days:
    > *"ማስጠንቀቂያ፡ የሜትፎርሚን መድሃኒት ለ 3 ቀናት ብቻ የሚበቃ ቀርቷል!"*
- [ ] **Task 5.3: Adherence History & Timeline Screen**
  - Calendar/Timeline view showing completed vs missed doses.
  - Weekly and monthly adherence percentage calculation per patient.
  - Log reason prompts when a dose is skipped (*ዝለል*).

---

## Phase 6: Accessibility, Audio & OEM Hardening (v1.3)

**Objective:** Ensure extreme reliability across common Ethiopian Android devices (Transsion/Tecno/Infinix, Samsung, Xiaomi) and support elderly users.

### Milestone 6 Deliverable
- Voice/Audio prompts in Amharic, OEM battery whitelist guide, and complete offline audit.

### Tasks
- [ ] **Task 6.1: Amharic Audio & Voice Alerts**
  - Pre-record clear, respectful Amharic voice chimes (or offline TTS integration) for elderly/illiterate users.
  - Configurable alarm sounds in Settings (Loud Ring, Gentle Chime, Voice Prompt).
- [ ] **Task 6.2: OEM Battery Whitelist Guide Screen**
  - Create in-app interactive troubleshooting screen directing users to disable OS "aggressive battery kill" on Tecno (HiOS), Infinix (XOS), Xiaomi (MIUI), and Samsung (OneUI).
- [ ] **Task 6.3: Offline Stress & Resilience Verification**
  - Verify app behavior across Airplane mode, low storage, and background app kill.

---

## Phase 7: Production Release & Post-Launch (v1.0 Production)

**Objective:** Store deployment, telemetry (offline-safe), backup, and maintenance.

### Milestone 7 Deliverable
- Production release on Google Play Store and Apple App Store.

### Tasks
- [ ] **Task 7.1: Local Backup & Restore**
  - Export encrypted SQLite database to JSON/file.
  - Import / restore data on a new device without internet.
- [ ] **Task 7.2: Store Assets & Metadata**
  - Prepare Amharic and English Play Store descriptions, screenshots, and privacy policy (emphasizing local-only data privacy).
- [ ] **Task 7.3: Performance & Binary Optimization**
  - Enable ProGuard/R8 on Android.
  - Optimize bundle size (Hermes enabled, vector asset compression).
- [ ] **Task 7.4: Production Launch**
  - Closed internal testing $\rightarrow$ Open beta $\rightarrow$ Production release.

---

## Summary of Milestones & Timelines

| Milestone | Target Scope | Estimated Timeline | Exit Criteria |
|---|---|---|---|
| **M0: Foundation** | Setup, SQLite, Notifee, i18n | Week 1 | Compiles cleanly; DB and permissions verified |
| **M1: Time Engine** | Ethiopian ↔ Gregorian converter | Week 2 | 100% unit test coverage for diurnal formulas |
| **M2: Alarm Core** | Exact alarms, Doze mode, Boot receiver | Week 3 | Alarms trigger on locked device and survive reboot |
| **M3: MVP Release** | Ethiopian Time Picker + Single User CRUD | Week 4 | End-to-end add, alert, and log flow working |
| **M4: Caregiver v1.1** | Multi-dependent profiles + filtering | Weeks 5–6 | Multiple dependents managed with custom alerts |
| **M5: Inventory v1.2** | Stock tracking + Adherence calendar | Weeks 7–8 | Low stock push alerts (<3 days) & compliance logs |
| **M6: Hardening v1.3** | Amharic audio + OEM battery guides | Weeks 9–10 | Tested on Tecno/Infinix/Samsung with audio prompts |
| **M7: Production** | Store submission & local backup | Weeks 11–12 | Public release on Google Play & App Store |
