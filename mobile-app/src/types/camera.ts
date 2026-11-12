/**
 * Shared camera data contracts (TV2 – Camera).
 * Proposed for team agreement before integration with vision/drowsiness modules.
 */

export type CameraPermissionStatus =
  | 'granted'
  | 'denied' // refused, but the OS may still show the prompt again
  | 'blocked' // refused permanently: user must open system settings
  | 'not-determined';

export type CameraStatus =
  | 'idle' // not monitoring, camera released
  | 'requesting-permission'
  | 'opening'
  | 'streaming' // camera open and frames flowing
  | 'paused' // app in background, camera released, will resume on foreground
  | 'error'; // see CameraState.error; user must restart manually

export type CameraErrorCode =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_BLOCKED'
  | 'CAMERA_UNAVAILABLE'
  | 'OPEN_FAILED'
  | 'CAMERA_INTERRUPTED'
  | 'CLOSE_FAILED';

export interface CameraError {
  code: CameraErrorCode;
  message: string;
}

export type FrameOrientation = 0 | 90 | 180 | 270;

/** Raw frame as reported by the platform adapter (not yet validated). */
export interface RawFrame {
  timestampMs: number;
  width: number;
  height: number;
  orientation: number;
  pixelFormat: string;
  /** Opaque reference to the native frame buffer. Never copied into JS. */
  handle: unknown;
}

/** Validated frame handed to the vision module (FrameInput in the plan). */
export interface FrameInput {
  timestampMs: number;
  width: number;
  height: number;
  orientation: FrameOrientation;
  pixelFormat: string;
  handle: unknown;
}

export interface CameraState {
  status: CameraStatus;
  permission: CameraPermissionStatus;
  /** Present only when status === 'error' (or a start attempt failed). */
  error: CameraError | null;
}
