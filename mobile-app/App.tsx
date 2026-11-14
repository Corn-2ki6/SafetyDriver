
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
} from '@expo-google-fonts/be-vietnam-pro';

import { TabBar, type Tab } from './src/components/TabBar';
import { AlertScreen } from './src/screens/AlertScreen';
import { ErrorScreen } from './src/screens/ErrorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MonitorScreen } from './src/screens/MonitorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { AlertSys } from './src/features/alerts/AlertSys';
import { DrowsinessTracker } from './src/features/drowsiness/DrowsinessState';
import { parseVisionFrame } from './src/features/vision';
import type { CameraFrameEvent } from './modules/safetydriver-camera/src';
import {
  getAlertEvents,
  saveAlertEvent,
} from './src/storage/AlertStorage';

import { colors } from './src/theme';
import {
  defaultSettings,
  type AlertEvent,
  type Metrics,
} from './src/types';

export type AppLifecycleState =
  | 'idle'
  | 'starting'
  | 'monitoring'
  | 'alert'
  | 'noFace'
  | 'error';

const EMPTY_METRICS: Metrics = {
  ear: null,
  mar: null,
  pitchDeg: null,
  fps: null,
  eyesClosedSec: null,
  eyesOpenSec: null,
  noFaceSec: null,
};

export default function App() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  const [tab, setTab] = useState<Tab>('monitor');
  const [state, setState] = useState<AppLifecycleState>('idle');
  const [settings, setSettings] = useState(defaultSettings);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMessage, setErrorMessage] = useState('Không thể khởi động camera.');
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [faceFound, setFaceFound] = useState<boolean | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ kind: 'eyesClosed' | 'yawn' | 'headNod'; detail: string } | null>(null);

  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const alertSys = useMemo(() => new AlertSys(), []);
  const drowsinessTracker = useMemo(() => new DrowsinessTracker(), []);

  const errorAt = useMemo(() => new Date(), [state]);
  const monitoring = state === 'monitoring' || state === 'alert' || state === 'noFace';

  useEffect(() => {
    let active = true;

    getAlertEvents()
      .then((savedEvents) => {
        if (active) {
          setEvents(savedEvents);
          setHistoryLoaded(true);
        }
      })
      .catch((error) => {
        console.warn('Không thể đọc lịch sử cảnh báo:', error);

        if (active) {
          setHistoryLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    if (state !== 'alert') return;
    if (!settings.saveHistory) return;
    if (!alertInfo) return;

    const event = alertSys.trigger({
      kind: alertInfo.kind,
      detail: alertInfo.detail,
    });

    if (!event) return;

    setEvents((current) =>
      [event, ...current].sort((a, b) => b.at.getTime() - a.at.getTime()),
    );

    saveAlertEvent(event).catch((error) => {
      console.warn('Không thể lưu cảnh báo:', error);
    });
  }, [state, settings.saveHistory, historyLoaded, alertSys, alertInfo]);

  useEffect(() => {
    if (!monitoring) return;

    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [monitoring]);

  const start = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          setErrorMessage('Quyền camera bị từ chối. Hãy cấp quyền camera trong cài đặt Android rồi thử lại.');
          setState('error');
          return;
        }
      } catch (error) {
        console.warn('Không thể yêu cầu quyền camera:', error);
        setErrorMessage('Không thể yêu cầu quyền camera trên thiết bị Android.');
        setState('error');
        return;
      }
    }

    drowsinessTracker.reset();
    setMetrics(EMPTY_METRICS);
    setFaceFound(null);
    setAlertInfo(null);
    setErrorMessage('');
    setState('starting');
    setElapsedSec(0);
  }, [drowsinessTracker]);

  const onCameraReady = useCallback(() => {
    setState((current) => current === 'starting' ? 'monitoring' : current);
  }, []);

  const onCameraError = useCallback((message: string) => {
    setErrorMessage(message);
    setState((current) =>
      current === 'starting' || current === 'monitoring' || current === 'noFace' || current === 'alert'
        ? 'error'
        : current,
    );
  }, []);

  const stop = useCallback(() => {
    drowsinessTracker.reset();
    setElapsedSec(0);
    setMetrics(EMPTY_METRICS);
    setFaceFound(null);
    setAlertInfo(null);
    setState('idle');
  }, [drowsinessTracker]);

  const onCameraFrame = useCallback((nativeFrame: CameraFrameEvent) => {
    const frame = parseVisionFrame(nativeFrame);
    if (!frame) {
      onCameraError('Frame camera không đúng hợp đồng dữ liệu; quá trình giám sát đã dừng.');
      return;
    }

    const { metrics: nextMetrics, result } = drowsinessTracker.update(frame, settings);
    setMetrics(nextMetrics);
    setFaceFound(
      frame.status === 'FACE_DETECTED'
        ? true
        : frame.status === 'NO_FACE'
          ? false
          : null,
    );

    if (result.status === 'drowsy') {
      const eyesClosed =
        nextMetrics.eyesClosedSec !== null &&
        nextMetrics.eyesClosedSec >= settings.eyesClosedSec;
      setAlertInfo((current) => current ?? {
        kind: eyesClosed ? 'eyesClosed' : 'yawn',
        detail: result.reasons.join(' · '),
      });
    } else if (
      result.status === 'noFace' ||
      (result.status === 'awake' && (nextMetrics.eyesOpenSec ?? 0) >= 3)
    ) {
      setAlertInfo(null);
    }

    setState((current) => {
      if (result.status === 'noFace') return 'noFace';
      if (result.status === 'drowsy') return 'alert';
      if (
        current === 'alert' &&
        (result.status !== 'awake' || (nextMetrics.eyesOpenSec ?? 0) < 3)
      ) {
        return 'alert';
      }
      return 'monitoring';
    });
  }, [drowsinessTracker, onCameraError, settings]);

  const changeTab = useCallback((nextTab: Tab) => {
    if (nextTab !== 'monitor' && state !== 'idle' && state !== 'error') {
      stop();
    }
    setTab(nextTab);
  }, [state, stop]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const alerting = tab === 'monitor' && state === 'alert';
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {alerting ? (
          <AlertScreen
            metrics={metrics}
            settings={settings}
            alertDetail={alertInfo?.detail ?? 'Dấu hiệu cần chú ý được phát hiện.'}
            onStop={stop}
            onCameraReady={onCameraReady}
            onCameraError={onCameraError}
            onCameraFrame={onCameraFrame}
          />
        ) : tab === 'history' ? (
          <HistoryScreen events={settings.saveHistory ? events : []} />
        ) : tab === 'settings' ? (
          <SettingsScreen settings={settings} onChange={setSettings} />
        ) : state === 'idle' ? (
          <HomeScreen onStart={start} />
        ) : state === 'error' ? (
          <ErrorScreen
            code="CAMERA_UNAVAILABLE"
            message={errorMessage}
            at={errorAt}
            onRetry={start}
          />
        ) : (
          <MonitorScreen
            faceFound={state === 'starting' ? null : faceFound}
            starting={state === 'starting'}
            elapsedSec={elapsedSec}
            metrics={metrics}
            settings={settings}
            onStop={stop}
            onCameraReady={onCameraReady}
            onCameraError={onCameraError}
            onCameraFrame={onCameraFrame}
          />
        )}

        {alerting ? null : <TabBar active={tab} onChange={changeTab} />}
      </View>
    </SafeAreaProvider>
  );
}
