
import { useEffect, useMemo, useRef, useState } from 'react';
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
  clearAlertEvents,
} from './src/storage/AlertStorage';

import {
  checkDatabaseTables,
  checkDatabaseData,
  createMonitoringSession,
  finishMonitoringSession,
} from './src/storage/Database';

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

  // ID phiên giám sát hiện tại
  const sessionIdRef = useRef<string | null>(null);

  // Danh sách cảnh báo
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Hệ thống cảnh báo
  const alertSys = useMemo(() => new AlertSys(), []);

  const errorAt = useMemo(() => new Date(), [state]);

  // Đọc database và lịch sử khi mở ứng dụng
  useEffect(() => {
    let active = true;

    checkDatabaseTables()
      .then((tables) => {
        console.log('SQLite tables:', tables);
      })
      .catch((error) => {
        console.error('SQLite error:', error);
      });

    checkDatabaseData()
      .then(({ sessions, alerts }) => {
        console.log('===== SQLITE DATA CHECK =====');
        console.log('Monitoring sessions:', sessions);
        console.log('Alert events:', alerts);
      })
      .catch((error) => {
        console.error('SQLite data check error:', error);
      });

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

  // Bắt đầu phiên giám sát
  const start = async () => {
    try {
      if (sessionIdRef.current) {
        await finishMonitoringSession(
          sessionIdRef.current,
          'interrupted',
        );

        sessionIdRef.current = null;
      }

      const sessionId = await createMonitoringSession();

      sessionIdRef.current = sessionId;

      setElapsedSec(0);
      alertSys.resetCooldowns();
      setState('awake');

      console.log('Monitoring started:', sessionId);
    } catch (error) {
      console.error('Cannot start monitoring:', error);
      setState('error');
    }
  };

  // Kết thúc phiên giám sát
  const stop = async () => {
    const sessionId = sessionIdRef.current;

    try {
      if (sessionId) {
        await finishMonitoringSession(
          sessionId,
          'completed',
        );

        console.log('Monitoring stopped:', sessionId);
      }
    } catch (error) {
      console.error('Cannot finish monitoring:', error);
    } finally {
      sessionIdRef.current = null;
      setState('idle');
      setElapsedSec(0);
    }
  };

  // Xóa toàn bộ lịch sử cảnh báo trong SQLite
  const clearHistory = async () => {
    try {
      await clearAlertEvents();

      setEvents([]);

      console.log(
        'SQLite: Alert history cleared successfully',
      );
    } catch (error) {
      console.error(
        'Cannot clear alert history:',
        error,
      );
    }
  };

  // Tạo và lưu cảnh báo khi trạng thái chuyển sang alert
  useEffect(() => {
    if (!historyLoaded) return;
    if (state !== 'alert') return;
    if (!settings.saveHistory) return;

    const sessionId = sessionIdRef.current;

    if (!sessionId) {
      console.warn(
        'Không có phiên giám sát để lưu cảnh báo.',
      );
      return;
    }

    const event = alertSys.trigger({
      kind: 'eyesClosed',
      detail:
        'Phát hiện nhắm mắt kéo dài trong quá trình giám sát.',
    });

    if (!event) return;

    setEvents((current) =>
      [event, ...current].sort(
        (a, b) => b.at.getTime() - a.at.getTime(),
      ),
    );

    saveAlertEvent(sessionId, event).catch((error) => {
      console.warn(
        'Không thể lưu cảnh báo:',
        error,
      );
    });
  }, [
    state,
    settings.saveHistory,
    historyLoaded,
    alertSys,
  ]);

  // Chuyển trạng thái mô phỏng trong bản development
  const nextDemoState = __DEV__
    ? () =>
        setState(
          (currentState) =>
            DEMO_CYCLE[
              (DEMO_CYCLE.indexOf(currentState) + 1) %
                DEMO_CYCLE.length
            ],
        )
    : undefined;

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
        }}
      />
    );
  }

  const alerting =
    tab === 'monitor' && state === 'alert';

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
        }}
      >
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
            onClear={clearHistory}
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
            metrics={
              demoMetrics[
                state === 'awake' ? 'awake' : 'noFace'
              ]
            }
            settings={settings}
            onStop={stop}
            onPreviewPress={nextDemoState}
          />
        )}

        {alerting ? null : (
          <TabBar
            active={tab}
            onChange={setTab}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}
