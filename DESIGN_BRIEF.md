# UI & UX Design Brief: Ethiopian Local Time Medication Reminder App (የመድሃኒት ማስታወሻ)

**Status:** Final Specification  
**Design Vision:** Dignified, cultural, high-clarity healthcare companion bridging Ethiopian solar time with modern mobile design.  
**Target Audience:** Patients with chronic conditions, elderly family members, and multi-dependent caregivers in Ethiopia.  

---

## 1. UX Design Philosophy & Core Principles

1. **Cultural Intuitiveness over Translation:**  
   The user interface must not feel like an English app translated into Amharic; it must feel natively crafted around the **Ethiopian solar day cycle** (ጠዋት $\rightarrow$ ከሰዓት $\rightarrow$ ማታ $\rightarrow$ ሌሊት).
2. **One-Thumb Reachability (Ergonomics):**  
   All critical daily actions (*ወሰድኩ*, *አዘግይ*, *ዝለል*, patient filtering) reside in the lower two-thirds of the screen for effortless single-hand usage.
3. **High Tactile Affordance & Forgiving Design:**  
   Given elderly users or patients with vision impairments/tremors, buttons have generous padding (minimum 48×48 dp touch target) and distinct color/icon hierarchy to prevent accidental taps.
4. **Calm, High-Trust Healthcare Aesthetic:**  
   Avoid harsh alarms or anxiety-inducing medical interfaces. Use clean glassmorphic elevation, soft rounded geometry, and reassuring feedback states.

---

## 2. Visual Identity & Color System

The palette pairs modern healthcare blues with vibrant, culturally grounded diurnal tones representing the solar transit across Ethiopia.

### 2.1 Primary Brand & Neutral Tokens
| Token Name | Hex Code | Purpose | Preview |
|---|---|---|---|
| `brand-primary` | `#2563EB` | Primary CTA, active selections, brand accents | Royal Blue |
| `brand-navy` | `#0F172A` | Primary typography, dark surface elements | Midnight Navy |
| `surface-canvas` | `#F8FAFC` | App background canvas, clean and glare-free | Off-white Slate |
| `surface-card` | `#FFFFFF` | Elevated cards, dialogs, bottom sheets | Pure White |
| `border-subtle` | `#E2E8F0` | Dividers, card strokes, unfocused inputs | Light Slate |

### 2.2 Diurnal Quadrant Colors (The Solar Cycle)
Each Ethiopian time segment has a distinctive thematic ambiance:
- **ጠዋት (Morning: 12:00 – 05:59):**  
  *Dawn Amber & Gold* — Accent `#D97706` | Background `#FEF3C7` | Mood: Awakening, optimistic.
- **ከሰዓት (Afternoon: 06:00 – 11:59):**  
  *High-Sky Azure* — Accent `#0284C7` | Background `#E0F2FE` | Mood: Focused, midday clarity.
- **ማታ (Evening: 12:00 – 05:59):**  
  *Sunset Twilight Violet* — Accent `#7C3AED` | Background `#EDE9FE` | Mood: Calm, wind-down.
- **ሌሊት (Night: 06:00 – 11:59):**  
  *Deep Indigo Moon* — Accent `#3B82F6` | Background `#1E293B` | Mood: Restful, non-intrusive.

### 2.3 Semantic Healthcare Statuses
- **ተወስዷል (Taken):** `#16A34A` (Emerald Green) — High dopamine, reassuring completion.
- **ተዘግይቷል (Snoozed):** `#D97706` (Warm Amber) — Cautionary, pending resolution.
- **አልፏል / ተዘሏል (Missed/Skipped):** `#DC2626` (Muted Crimson) — Clear visibility without shame.
- **ክምችት ማስጠንቀቂያ (Low Stock $\le$ 3 days):** `#EA580C` (Safety Orange) with badge glow.

---

## 3. Typography & Ge'ez Script Pairing

Amharic typography requires extra vertical line height and optical weight balancing to prevent diacritic crowding.

### 3.1 Font Families
- **Amharic (አማርኛ) Headings & Body:** *Noto Sans Ethiopic* (Weights: Bold 700 for labels, Regular 400 for copy).
- **Numerals & Metrics:** *Inter* / *Outfit* (Tabular figures for clock alignment and pill counts).

### 3.2 Type Scale
| Role | Size / Line-Height | Weight | Example |
|---|---|---|---|
| **Display Header** | 24px / 32px | Bold (700) | የዛሬ የመድሃኒት መርሃ-ግብር |
| **Card Title** | 18px / 26px | Semi-Bold (600) | ሜትፎርሚን (500mg) |
| **Time Dial Number** | 28px / 34px | Bold (700) | 02:30 ጠዋት |
| **Body / Instructions**| 14px / 22px | Regular (400) | 1 ኪኒን ከምግብ በኋላ ይውሰዱ |
| **Micro Labels** | 12px / 16px | Medium (500) | ቀሪ ኪኒን፡ 18 |

---

## 4. Component Architecture & UI Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Top Bar]  የመድሃኒት ማስታወሻ                 [+ አዲስ]    │
├──────────────────────────────────────────────────────────┤
│  [Patient Switcher: Horizontal Scroll]                   │
│  (● ሁሉም)  (● ያሬድ/እኔ)  (● እማማ)  (● ልጅ)  [+ ጨምር]       │
├──────────────────────────────────────────────────────────┤
│  [Active Filter Banner: e.g. "የእማማ መድሃኒቶች"]             │
├──────────────────────────────────────────────────────────┤
│  [Chronological Today Schedule Feed]                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 02:00 ጠዋት (8:00 AM)               [የደም ግፊት]     │  │
│  │ አምሎዲፒን • 1 ኪኒን (ከምግብ በኋላ)                      │  │
│  │ ክምችት፡ 24 ኪኒን ቀርቷል                              │  │
│  │ ┌──────────────────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │ │    ✓ ወሰድኩ (Taken)   │ │ ⏰ አዘግይ  │ │  ✕ ዝለል   │ │  │
│  │ └──────────────────────┘ └──────────┘ └──────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 08:00 ከሰዓት (2:00 PM)              [ስኳር]           │  │
│  │ ሜትፎርሚን • 1 ኪኒን (ከምግብ ጋር)                         │  │
│  │ ⚠️ ማስጠንቀቂያ፡ ለ 2 ቀናት ብቻ የሚበቃ ቀርቷል (6 ኪኒን)      │  │
│  │ ┌──────────────────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │ │    ✓ ወሰድኩ (Taken)   │ │ ⏰ አዘግይ  │ │  ✕ ዝለል   │ │  │
│  │ └──────────────────────┘ └──────────┘ └──────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  [Bottom Navigation Bar]                                 │
│  [📅 የዛሬ ሰዓት]    [👥 ታካሚዎች]    [📊 ታሪክ]    [⚙️ ቅንብሮች]   │
└──────────────────────────────────────────────────────────┘
```

### 4.1 Custom Ethiopian Time Picker Dial
- **Segment Selector (Top):** 4 pill buttons for **ጠዋት**, **ከሰዓት**, **ማታ**, **ሌሊት** with subtle gradient glows corresponding to the diurnal colors.
- **Hour Grid:** Dynamic 6-item radial/grid selector displaying valid cultural hours for that segment.
- **Minute Steppers:** Quick presets `:00`, `:15`, `:30`, `:45`.
- **Live System Preview Box:** Real-time feedback box at the bottom displaying:  
  *“ይህ ሰዓት በስልክዎ መደበኛ ሰዓት 8:00 AM (ጠዋት) ይሆናል”*

### 4.2 Full-Screen Wake-up Alarm Overlay
When the alarm triggers on a locked or waking phone:
1. **Pulsing Halo:** Background exhibits a gentle radial pulsation matching the dependent’s theme color.
2. **High-Contrast Typography:**
   - Patient Name & Photo: *"ያሬድ፣ የመድሃኒት ሰዓት ደርሷል!"*
   - Pill Name & Dosage: *"ሜትፎርሚን (1 ኪኒን - ከምግብ በኋላ)"*
3. **Action Target Distribution:**
   - **Primary (65% width):** Giant green button `✓ ወሰድኩ` (Taken).
   - **Secondary (30% width):** Snooze button `⏰ አዘግይ (10 ደቂቃ)`.
   - **Tertiary (Text link):** `ዝለል (Skip)` at the bottom.

---

## 5. Micro-Interactions & Motion Design

1. **Dose Confirmation (Take Action):**
   - Tap `✓ ወሰድኩ`:
     - Immediate haptic impact (medium impact).
     - Card background gently flashes emerald (`#DCFCE7`).
     - Stock badge animates down (`30` $\rightarrow$ `29`).
     - Card slides smoothly into the "Completed" section with an animated checkmark.
2. **Diurnal Time Shift:**
   - Selecting between *ጠዋት* and *ማታ* triggers a 250ms smooth crossfade of the ambient card background from warm sunrise amber to cool twilight purple.
3. **Low Inventory Pulsation:**
   - Cards with $\le 3$ days remaining display an amber warning chip with a subtle breathing pulse every 4 seconds to catch caregiver attention.

---

## 6. Accessibility & Localization Standards

- **Contrast Ratios:** All text elements meet **WCAG 2.1 AAA** (contrast ratio $\ge 7:1$ for body, $\ge 4.5:1$ for headers).
- **VoiceOver / TalkBack:** Every button, card, and time dial segment has descriptive accessibility labels in Amharic (e.g., *"የሜትፎርሚን መድሃኒት መውሰጃ ሰዓት፡ ጠዋት ሁለት ሰዓት ከሰላሳ ደቂቃ"*).
- **Text Scaling:** Supports Android/iOS system-wide large text scaling up to 200% without breaking button bounds or overlapping labels.
