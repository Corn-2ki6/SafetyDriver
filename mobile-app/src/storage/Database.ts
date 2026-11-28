
import * as SQLite from 'expo-sqlite';
import type { AlertKind } from '../types';

const DATABASE_NAME = 'safetydriver.db';

type Database = Awaited<
  ReturnType<typeof SQLite.openDatabaseAsync>
>;

let databasePromise: Promise<Database> | null = null;

export type MonitoringStatus =
  | 'running'
  | 'completed'
  | 'interrupted';

// Mở database và tạo bảng nếu chưa tồn tại
export function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS monitoring_session (
            session_id TEXT PRIMARY KEY NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            status TEXT NOT NULL
              CHECK (status IN ('running', 'completed', 'interrupted'))
          );

          CREATE TABLE IF NOT EXISTS alert_event (
            id TEXT PRIMARY KEY NOT NULL,
            session_id TEXT NOT NULL,
            kind TEXT NOT NULL
              CHECK (kind IN ('eyesClosed', 'yawn', 'headNod')),
            detail TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            FOREIGN KEY (session_id)
              REFERENCES monitoring_session(session_id)
              ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_alert_session
          ON alert_event(session_id);

          CREATE INDEX IF NOT EXISTS idx_alert_time
          ON alert_event(occurred_at);
        `);

        console.log('SQLite: Database initialized successfully');
        return db;
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

// Tạo ID phiên giám sát
function createSessionId(): string {
  return `session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// Tạo phiên giám sát mới
export async function createMonitoringSession(): Promise<string> {
  const db = await getDatabase();
  const sessionId = createSessionId();
  const startedAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO monitoring_session
      (session_id, started_at, ended_at, status)
     VALUES (?, ?, NULL, 'running')`,
    sessionId,
    startedAt,
  );

  console.log('SQLite: Monitoring session created:', sessionId);

  return sessionId;
}

// Kết thúc phiên giám sát
export async function finishMonitoringSession(
  sessionId: string,
  status: Exclude<MonitoringStatus, 'running'> = 'completed',
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE monitoring_session
     SET ended_at = ?, status = ?
     WHERE session_id = ? AND status = 'running'`,
    new Date().toISOString(),
    status,
    sessionId,
  );

  console.log('SQLite: Monitoring session finished:', sessionId);
}

// Lưu một cảnh báo vào phiên đang giám sát
export async function insertAlertEvent(
  sessionId: string,
  event: {
    id: string;
    kind: AlertKind;
    detail: string;
    at: Date;
  },
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO alert_event
      (id, session_id, kind, detail, occurred_at)
     VALUES (?, ?, ?, ?, ?)`,
    event.id,
    sessionId,
    event.kind,
    event.detail,
    event.at.toISOString(),
  );
}

// Đọc các cảnh báo trong 3 ngày gần nhất
export async function queryAlertEvents(): Promise<
  {
    id: string;
    kind: AlertKind;
    detail: string;
    occurred_at: string;
  }[]
> {
  const db = await getDatabase();

  const cutoff = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Xóa cảnh báo cũ hơn 3 ngày
  await db.runAsync(
    `DELETE FROM alert_event WHERE occurred_at < ?`,
    cutoff,
  );

  return db.getAllAsync<{
    id: string;
    kind: AlertKind;
    detail: string;
    occurred_at: string;
  }>(
    `SELECT id, kind, detail, occurred_at
     FROM alert_event
     WHERE occurred_at <= ?
     ORDER BY occurred_at DESC`,
    new Date().toISOString(),
  );
}

// Xóa toàn bộ lịch sử cảnh báo
export async function deleteAllAlertEvents(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM alert_event');
}

// Kiểm tra các bảng đã được tạo
export async function checkDatabaseTables(): Promise<string[]> {
  const db = await getDatabase();

  const tables = await db.getAllAsync<{ name: string }>(
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name IN ('monitoring_session', 'alert_event')
     ORDER BY name`,
  );

  return tables.map((table) => table.name);
}
// Kiểm tra dữ liệu phiên giám sát và cảnh báo
export async function checkDatabaseData() {
  const db = await getDatabase();

  const sessions = await db.getAllAsync<{
    session_id: string;
    started_at: string;
    ended_at: string | null;
    status: string;
  }>(
    `SELECT session_id, started_at, ended_at, status
     FROM monitoring_session
     ORDER BY started_at DESC`,
  );

  const alerts = await db.getAllAsync<{
    id: string;
    session_id: string;
    kind: string;
    detail: string;
    occurred_at: string;
  }>(
    `SELECT id, session_id, kind, detail, occurred_at
     FROM alert_event
     ORDER BY occurred_at DESC`,
  );

  console.log('SQLite monitoring sessions:', sessions);
  console.log('SQLite alert events:', alerts);

  return { sessions, alerts };
}