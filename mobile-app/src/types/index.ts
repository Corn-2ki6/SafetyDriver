export type MonitorState = 'idle' | 'awake' | 'alert' | 'noFace' | 'error';

/** null = measurement missing or invalid; the UI shows "—" instead of a made-up value. */
export type Metrics = {
  ear: number | null;
  mar: number | null;
  pitchDeg: number | null;
  fps: number | null;
  eyesClosedSec: number | null;
  eyesOpenSec: number | null;
  noFaceSec: number | null;
};

export type AlertKind = 'eyesClosed' | 'yawn' | 'headNod';

export type AlertEvent = {
  id: string;
  kind: AlertKind;
  detail: string;
  at: Date;
};

export type Settings = {
  eyesClosedSec: number;
  earThreshold: number;
  marThreshold: number;
  volume: number;
  flashBorder: boolean;
  saveHistory: boolean;
};

export const defaultSettings: Settings = {
  eyesClosedSec: 2.0,
  earThreshold: 0.25,
  marThreshold: 0.6,
  volume: 0.9,
  flashBorder: true,
  saveHistory: true,
};
