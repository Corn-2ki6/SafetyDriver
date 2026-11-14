import { requireNativeViewManager, requireOptionalNativeModule } from 'expo-modules-core';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';
import { Platform } from 'react-native';

export type CameraFrameEvent = {
  schemaVersion: 1;
  timestampMs: number;
  width: number;
  height: number;
  rotationApplied: 0 | 90 | 180 | 270;
  mirrored: false;
  inferenceMs: number;
  status: 'FACE_DETECTED' | 'NO_FACE' | 'INVALID_LANDMARKS';
  landmarks: { x: number; y: number; z: number }[];
};

export type CameraErrorEvent = {
  code: string;
  message: string;
};

export type SafetyDriverCameraViewProps = ViewProps & {
  active: boolean;
  onFrame?: (event: NativeSyntheticEvent<CameraFrameEvent>) => void;
  onCameraError?: (event: NativeSyntheticEvent<CameraErrorEvent>) => void;
  onCameraReady?: () => void;
};

const moduleAvailable =
  Platform.OS === 'android' &&
  requireOptionalNativeModule('SafetyDriverCamera') !== null;

const NativeView = moduleAvailable
  ? requireNativeViewManager<SafetyDriverCameraViewProps>('SafetyDriverCamera')
  : null;

export default function SafetyDriverCameraView(props: SafetyDriverCameraViewProps) {
  if (!NativeView) {
    return null;
  }
  return <NativeView {...props} />;
}

export { moduleAvailable as isSafetyDriverCameraAvailable };
