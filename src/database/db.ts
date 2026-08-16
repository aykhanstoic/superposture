import Database from "@tauri-apps/plugin-sql";
import { format, subDays } from "date-fns";
import type { DashboardData, DailyStats, SessionRecord } from "@/types";

const DB_PATH = "sqlite:upsit.db";

let dbInstance: Database | null = null;

async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_PATH);
    await initSchema(dbInstance);
  }
  return dbInstance;
}

async function initSchema(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      avg_score REAL DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      reminder_count INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS score_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      score REAL NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      avg_score REAL DEFAULT 0,
      monitoring_seconds INTEGER DEFAULT 0,
      reminder_count INTEGER DEFAULT 0,
      good_streak_seconds INTEGER DEFAULT 0
    )
  `);
}

export async function startSession(): Promise<number> {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.execute(
    "INSERT INTO sessions (start_time) VALUES ($1)",
    [now],
  );
  return result.lastInsertId ?? 0;
}

export async function endSession(
  sessionId: number,
  avgScore: number,
  durationSeconds: number,
  reminderCount: number,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE sessions SET end_time = $1, avg_score = $2, duration_seconds = $3, reminder_count = $4 WHERE id = $5`,
    [now, avgScore, durationSeconds, reminderCount, sessionId],
  );
}

export async function saveScoreSample(
  sessionId: number,
  score: number,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO score_samples (session_id, timestamp, score) VALUES ($1, $2, $3)",
    [sessionId, now, score],
  );
}

export async function updateDailyStats(
  avgScore: number,
  monitoringSeconds: number,
  reminderCount: number,
  goodStreakSeconds: number,
): Promise<void> {
  const db = await getDb();
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await db.select<DailyStats[]>(
    "SELECT * FROM daily_stats WHERE date = $1",
    [today],
  );

  if (existing.length > 0) {
    const prev = existing[0];
    const totalSeconds = prev.monitoring_seconds + monitoringSeconds;
    const weightedAvg =
      totalSeconds > 0
        ? (prev.avg_score * prev.monitoring_seconds + avgScore * monitoringSeconds) /
          totalSeconds
        : avgScore;

    await db.execute(
      `UPDATE daily_stats SET avg_score = $1, monitoring_seconds = $2,
       reminder_count = $3, good_streak_seconds = $4 WHERE date = $5`,
      [
        weightedAvg,
        totalSeconds,
        prev.reminder_count + reminderCount,
        Math.max(prev.good_streak_seconds, goodStreakSeconds),
        today,
      ],
    );
  } else {
    await db.execute(
      `INSERT INTO daily_stats (date, avg_score, monitoring_seconds, reminder_count, good_streak_seconds)
       VALUES ($1, $2, $3, $4, $5)`,
      [today, avgScore, monitoringSeconds, reminderCount, goodStreakSeconds],
    );
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const db = await getDb();
  const today = format(new Date(), "yyyy-MM-dd");

  const todayStats = await db.select<DailyStats[]>(
    "SELECT * FROM daily_stats WHERE date = $1",
    [today],
  );

  const weeklyTrend: { date: string; avgScore: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const rows = await db.select<DailyStats[]>(
      "SELECT * FROM daily_stats WHERE date = $1",
      [date],
    );
    weeklyTrend.push({
      date,
      avgScore: rows[0]?.avg_score ?? 0,
    });
  }

  const monthlyTrend: { date: string; avgScore: number }[] = [];
  for (let i = 29; i >= 0; i -= 5) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const rows = await db.select<DailyStats[]>(
      "SELECT * FROM daily_stats WHERE date = $1",
      [date],
    );
    monthlyTrend.push({
      date,
      avgScore: rows[0]?.avg_score ?? 0,
    });
  }

  const stats = todayStats[0];

  return {
    todayMonitoringSeconds: stats?.monitoring_seconds ?? 0,
    todayAvgScore: stats?.avg_score ?? 0,
    longestGoodStreakSeconds: stats?.good_streak_seconds ?? 0,
    todayReminderCount: stats?.reminder_count ?? 0,
    weeklyTrend,
    monthlyTrend,
  };
}

export async function getRecentSessions(limit = 20): Promise<SessionRecord[]> {
  const db = await getDb();
  return db.select<SessionRecord[]>(
    "SELECT * FROM sessions ORDER BY start_time DESC LIMIT $1",
    [limit],
  );
}

export async function getDailyHistory(days = 30): Promise<DailyStats[]> {
  const db = await getDb();
  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  return db.select<DailyStats[]>(
    "SELECT * FROM daily_stats WHERE date >= $1 ORDER BY date DESC",
    [startDate],
  );
}

export async function initDatabase(): Promise<void> {
  await getDb();
}
