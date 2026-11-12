
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
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
import { demoMetrics } from './src/demoData';
import { AlertScreen } from './src/screens/AlertScreen';
import { ErrorScreen } from './src/screens/ErrorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MonitorScreen } from './src/screens/MonitorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { AlertSys } from './src/features/alerts/AlertSys';
import {
  getAlertEvents,
  saveAlertEvent,
} from './src/storage/AlertStorage';

import { colors } from './src/theme';
import {
  defaultSettings,
  type AlertEvent,
  type MonitorState,
} from './src/types';

const DEMO_CYCLE: MonitorState[] = [
  'awake',
  'alert',
  'noFace',
  'error',
];

export default function App() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  const [tab, setTab] = useState<Tab>('monitor');
  const [state, setState] = useState<MonitorState>('idle');
  const [settings, setSettings] = useState(defaultSettings);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Danh sách cảnh báo đã lưu
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Khởi tạo hệ thống cảnh báo TV4
  const alertSys = useMemo(() => new AlertSys(), []);

  const errorAt = useMemo(() => new Date(), [state]);
  const monitoring = state !== 'idle' && state !== 'error';

  // Đọc lịch sử từ bộ nhớ điện thoại khi mở ứng dụng
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

  // Tạo và lưu cảnh báo khi hệ thống chuyển sang trạng thái alert
  useEffect(() => {
    if (!historyLoaded) return;
    if (state !== 'alert') return;
    if (!settings.saveHistory) return;

    const event = alertSys.trigger({
      kind: 'eyesClosed',
      detail: 'Phát hiện nhắm mắt kéo dài trong quá trình giám sát.',
    });

    if (!event) return;

    setEvents((current) =>
      [event, ...current].sort(
        (a, b) => b.at.getTime() - a.at.getTime(),
      ),
    );

    saveAlertEvent(event).catch((error) => {
      console.warn('Không thể lưu cảnh báo:', error);
    });
  }, [state, settings.saveHistory, historyLoaded, alertSys]);

  // Đếm thời gian giám sát
  useEffect(() => {
    if (!monitoring) return;

    const id = setInterval(
      () => setElapsedSec((s) => s + 1),
      1000,
    );

    return () => clearInterval(id);
  }, [monitoring]);

  const start = () => {
    setElapsedSec(0);
    setState('awake');
  };

  const stop = () => setState('idle');

  // Chuyển trạng thái mô phỏng trong bản development
  const nextDemoState = __DEV__
    ? () =>
        setState(
          (s) =>
            DEMO_CYCLE[
              (DEMO_CYCLE.indexOf(s) + 1) % DEMO_CYCLE.length
            ],
        )
    : undefined;

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
            metrics={demoMetrics.alert}
            settings={settings}
            onStop={stop}
            onPreviewPress={nextDemoState}
          />
        ) : tab === 'history' ? (
          <HistoryScreen
            events={settings.saveHistory ? events : []}
          />
        ) : tab === 'settings' ? (
          <SettingsScreen
            settings={settings}
            onChange={setSettings}
          />
        ) : state === 'idle' ? (
          <HomeScreen onStart={start} />
        ) : state === 'error' ? (
          <ErrorScreen
            code="CAMERA_DISCONNECTED"
            at={errorAt}
            onRetry={start}
          />
        ) : (
          <MonitorScreen
            faceFound={state === 'awake'}
            elapsedSec={elapsedSec}
            metrics={demoMetrics[state === 'awake' ? 'awake' : 'noFace']}
            settings={settings}
            onStop={stop}
            onPreviewPress={nextDemoState}
          />
        )}

        {alerting ? null : (
          <TabBar active={tab} onChange={setTab} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
