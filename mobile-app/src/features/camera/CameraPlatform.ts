import type { CameraPermissionStatus, RawFrame } from '../../types/camera';

/**
 * Thin adapter over the real camera library (react-native-vision-camera and/or a
 * Kotlin native module). CameraManager only depends on this interface, so the
 * logic can be unit-tested without a device and the library can be swapped
 * after CAM-01 verification on a real phone.
 */
export interface CameraPlatform {
  getPermissionStatus(): Promise<CameraPermissionStatus>;
  requestPermission(): Promise<CameraPermissionStatus>;
  /** false when no camera exists or it is in use by another app. */
  isCameraAvailable(): Promise<boolean>;
  /** Opens the camera. Rejects if it cannot be opened. */
  open(handlers: {
    onFrame: (frame: RawFrame) => void;
    /** Called when an already-open camera is lost (disconnected, taken by another app). */
    onInterrupted: (reason: string) => void;
  }): Promise<void>;
  /** Releases the camera. Must be safe to call when already closed. */
  close(): Promise<void>;
}
