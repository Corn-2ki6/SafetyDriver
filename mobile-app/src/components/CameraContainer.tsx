import React from 'react';
import { Platform } from 'react-native';
import { colors } from '../theme';
import { CameraPreview } from './CameraPreview';
import { isSafetyDriverCameraAvailable } from '../../modules/safetydriver-camera/src';

/**
 * Centralised camera preview used by the whole app.
 * Rendered once in App.tsx and stays mounted while the app is in a
 * monitoring‑or‑alert lifecycle state. All props are derived from the
 * current App state so that the preview behaves exactly as before.
 */
export function CameraContainer({
  state,
  faceFound,
  metrics,
  onCameraReady,
  onCameraError,
  onCameraFrame,
}: {
  state: string;
  faceFound: boolean | null;
  metrics: any;
  onCameraReady: () => void;
  onCameraError: (msg: string) => void;
  onCameraFrame: (e: any) => void;
}) {
  // Determine preview appearance based on app lifecycle
  const previewHeight = state === 'alert' ? 200 : 300;
  const accent =
    state === 'alert'
      ? colors.danger
      : state === 'starting'
      ? colors.warning
      : colors.primary;
  const overlay =
    state === 'alert'
      ? 'face'
      : faceFound === true
      ? 'face'
      : faceFound === false
      ? 'guide'
      : undefined;
  const cameraActive = state === 'monitoring' || state === 'alert' || state === 'noFace';
  const cameraReady = state !== 'starting';

  // For Android we only render when the native module reports availability.
  if (Platform.OS === 'android' && !isSafetyDriverCameraAvailable) {
    // The preview component itself will invoke onCameraError if needed.
    return null;
  }

  return (
    <CameraPreview
      height={previewHeight}
      accent={accent}
      overlay={overlay}
      fps={metrics.fps}
      cameraActive={cameraActive}
      cameraReady={cameraReady}
      onCameraReady={onCameraReady}
      onCameraError={onCameraError}
      onCameraFrame={onCameraFrame}
    />
  );
}
