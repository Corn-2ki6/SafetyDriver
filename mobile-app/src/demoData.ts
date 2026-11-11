import type { AlertEvent, Metrics, MonitorState } from './types';

// Sample values copied from the Figma mockups so the screens render before the
// camera, vision and storage modules exist. Delete this file once they do.

const base: Metrics = { ear: null, mar: null, pitchDeg: null, fps: null, eyesClosedSec: null, eyesOpenSec: null, noFaceSec: null };

export const demoMetrics: Record<Exclude<MonitorState, 'idle' | 'error'>, Metrics> = {
  awake: { ...base, ear: 0.31, mar: 0.18, pitchDeg: 4, fps: 24, eyesClosedSec: 0.2 },
  alert: { ...base, fps: 24, eyesClosedSec: 2.6, eyesOpenSec: 1.2 },
  noFace: { ...base, fps: 22, noFaceSec: 3 },
};

const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
};

export const demoEvents: AlertEvent[] = [
  { id: '1', kind: 'eyesClosed', detail: 'Thời lượng nhắm mắt: 2.6s', at: at(0, 14, 32) },
  { id: '2', kind: 'yawn', detail: 'Ngáp liên tục 3 lần trong 1 phút', at: at(0, 13, 5) },
  { id: '3', kind: 'eyesClosed', detail: 'Thời lượng nhắm mắt: 2.2s', at: at(0, 9, 47) },
  { id: '4', kind: 'headNod', detail: 'Góc cúi đầu (pitch): 28°', at: at(1, 22, 18) },
  { id: '5', kind: 'eyesClosed', detail: 'Thời lượng nhắm mắt: 3.1s', at: at(1, 21, 40) },
];
