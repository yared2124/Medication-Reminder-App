/**
 * Local Database Schema Definition & SQL DDL
 *
 * Designed for SQLite (react-native-quick-sqlite, op-sqlite, or expo-sqlite)
 */

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    color TEXT NOT NULL,
    relationship TEXT,
    age INTEGER,
    emergency_contact TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    dosage_amount INTEGER NOT NULL DEFAULT 1,
    meal_timing TEXT NOT NULL,
    stock_count INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 6,
    instructions TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY NOT NULL,
    medication_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    ethiopian_hour INTEGER NOT NULL,
    ethiopian_minute INTEGER NOT NULL,
    diurnal_period TEXT NOT NULL,
    gregorian_hour INTEGER NOT NULL,
    gregorian_minute INTEGER NOT NULL,
    recurrence_type TEXT NOT NULL,
    days_of_week TEXT,
    interval_hours INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(medication_id) REFERENCES medications(id) ON DELETE CASCADE,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS intake_logs (
    id TEXT PRIMARY KEY NOT NULL,
    schedule_id TEXT NOT NULL,
    medication_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    scheduled_time INTEGER NOT NULL,
    actual_time INTEGER,
    status TEXT NOT NULL,
    reason TEXT,
    FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY(medication_id) REFERENCES medications(id) ON DELETE CASCADE,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_medications_profile ON medications(profile_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_medication ON schedules(medication_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_profile ON schedules(profile_id);
  CREATE INDEX IF NOT EXISTS idx_logs_profile_scheduled ON intake_logs(profile_id, scheduled_time);
`;
