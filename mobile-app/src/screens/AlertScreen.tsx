import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EyeOff, Square, TriangleAlert, Volume2, VolumeX } from 'lucide-react-native';
import { CameraPreview } from '../components/CameraPreview';
import { Button, Card, Chip, ProgressBar } from '../components/ui';
import { num } from '../format';
import { colors, tint, type } from '../theme';
import type { Metrics, Settings } from '../types';

const AUTO_DISMISS_SEC = 3;

type Props = { metrics: Metrics; settings: Settings; onStop: () => void; onPreviewPress?: () => void };

/** 04 · Cảnh báo buồn ngủ. Full screen, no tab bar. */
export function AlertScreen({ metrics, settings, onStop, onPreviewPress }: Props) {
  const insets = useSafeAreaInsets();
  // shortcut: only tracks the muted flag; play and stop the alarm in features/alerts.
  const [muted, setMuted] = useState(false);
  const flash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!settings.flashBorder) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.25, duration: 450, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flash, settings.flashBorder]);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['rgba(240, 69, 69, 0.35)', 'rgba(240, 69, 69, 0.05)']} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 26 }]}>
        <CameraPreview height={200} accent={colors.danger} overlay="face" fps={metrics.fps} onPress={onPreviewPress}>
          <Chip solid color={colors.danger} icon={EyeOff} label={`Mắt nhắm ${num(metrics.eyesClosedSec, 1, 's')}`} style={styles.bottomChip} />
        </CameraPreview>

        <View style={styles.ring}>
          <View style={styles.ringInner}>
            <TriangleAlert size={37} color={colors.white} />
          </View>
        </View>

        <Text style={[type.display, styles.center, { color: colors.danger }]} accessibilityRole="alert">
          CẢNH BÁO BUỒN NGỦ!
        </Text>
        <Text style={[type.body, styles.center]}>
          Phát hiện mắt nhắm liên tục hơn {settings.eyesClosedSec.toFixed(0)} giây. Hãy tấp vào nơi an toàn và nghỉ ngơi.
        </Text>
        <Chip
          color={muted ? colors.muted : colors.danger}
          icon={muted ? VolumeX : Volume2}
          label={muted ? 'Đã tắt chuông' : 'Chuông báo động đang phát'}
          style={{ alignSelf: 'center' }}
        />

        <Card style={{ gap: 8 }}>
          <View style={styles.between}>
            <Text style={type.caption}>Tự tắt khi mắt mở liên tục</Text>
            <Text style={type.label}>
              {num(metrics.eyesOpenSec, 1, 's')} / {AUTO_DISMISS_SEC.toFixed(1)}s
            </Text>
          </View>
          <ProgressBar value={(metrics.eyesOpenSec ?? 0) / AUTO_DISMISS_SEC} color={colors.warning} />
        </Card>

        <View style={{ flex: 1 }} />
        <Button label={muted ? 'Bật chuông' : 'Tắt chuông'} icon={muted ? VolumeX : Volume2} variant="secondary" onPress={() => setMuted((m) => !m)} />
        <Button label="Dừng giám sát" icon={Square} fillIcon variant="danger" onPress={onStop} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.border, { opacity: flash }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 26, gap: 16 },
  border: { ...StyleSheet.absoluteFill, borderWidth: 10, borderColor: colors.danger },
  bottomChip: { position: 'absolute', bottom: 12, alignSelf: 'center' },
  ring: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: tint(colors.danger, 0.3) },
  ringInner: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  center: { textAlign: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
