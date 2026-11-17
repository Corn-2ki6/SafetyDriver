
import type { AlertEvent } from '../types';
import {
  queryAlertEvents,
  insertAlertEvent,
  deleteAllAlertEvents,
} from './Database';

// Đọc lịch sử cảnh báo từ SQLite
export async function getAlertEvents(): Promise<AlertEvent[]> {
  const rows = await queryAlertEvents();

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    detail: row.detail,
    at: new Date(row.occurred_at),
  }));
}

// Lưu cảnh báo vào SQLite
export async function saveAlertEvent(
  sessionId: string,
  event: AlertEvent,
): Promise<void> {
  await insertAlertEvent(sessionId, event);
}

// Xóa toàn bộ lịch sử cảnh báo
export async function clearAlertEvents(): Promise<void> {
  await deleteAllAlertEvents();
}
