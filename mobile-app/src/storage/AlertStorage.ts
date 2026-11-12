
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AlertEvent, AlertKind } from '../types';

const STORAGE_KEY = '@safetydriver/alert_history';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const VALID_KINDS: AlertKind[] = [
  'eyesClosed',
  'yawn',
  'headNod',
];

// Chuyển dữ liệu lưu trong máy thành AlertEvent
function parseEvent(data: any): AlertEvent | null {
  if (
    !data ||
    typeof data.id !== 'string' ||
    !VALID_KINDS.includes(data.kind) ||
    typeof data.detail !== 'string'
  ) {
    return null;
  }

  const at = new Date(data.at);

  if (!Number.isFinite(at.getTime())) {
    return null;
  }

  return {
    id: data.id,
    kind: data.kind,
    detail: data.detail,
    at,
  };
}

// Đọc dữ liệu từ bộ nhớ điện thoại
export async function getAlertEvents(): Promise<AlertEvent[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    const data: unknown = JSON.parse(raw);

    if (!Array.isArray(data)) return [];

    const now = Date.now();
    const cutoff = now - THREE_DAYS_MS;

    const events = data
      .map(parseEvent)
      .filter((event): event is AlertEvent => event !== null)
      .filter((event) => {
        const time = event.at.getTime();
        return time >= cutoff && time <= now;
      })
      .sort((a, b) => b.at.getTime() - a.at.getTime());

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(events),
    );

    return events;
  } catch {
    return [];
  }
}

// Lưu một cảnh báo mới
export async function saveAlertEvent(
  event: AlertEvent,
): Promise<void> {
  const currentEvents = await getAlertEvents();

  const events = [
    event,
    ...currentEvents.filter((item) => item.id !== event.id),
  ];

  const now = Date.now();
  const cutoff = now - THREE_DAYS_MS;

  const validEvents = events.filter((item) => {
    const time = item.at.getTime();
    return time >= cutoff && time <= now;
  });

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(validEvents),
  );
}

// Xóa toàn bộ lịch sử cảnh báo
export async function clearAlertEvents(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
