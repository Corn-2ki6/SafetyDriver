import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type NativeAlarmModule = {
  startAlertTone(volume: number): void;
  stopAlertTone(): void;
};

// The present app implements native face analysis and audio on Android only.
// No fake success indicator on web/iOS or in Expo Go.
const alarm = Platform.OS === 'android'
  ? requireOptionalNativeModule<NativeAlarmModule>('SafetyDriverCamera')
  : null;

export const isAlertToneAvailable = alarm !== null;

export function startAlertTone(volume: number): boolean {
  if (!alarm || !Number.isFinite(volume) || volume <= 0) return false;
  try {
    alarm.startAlertTone(Math.max(0, Math.min(1, volume)));
    return true;
  } catch (error) {
    console.warn('Không thể phát cảnh báo âm thanh:', error);
    return false;
  }
}

export function stopAlertTone(): void {
  if (!alarm) return;
  try {
    alarm.stopAlertTone();
  } catch (error) {
    console.warn('Không thể dừng cảnh báo âm thanh:', error);
  }
}
