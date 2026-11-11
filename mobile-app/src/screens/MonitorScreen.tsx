import { StyleSheet, Text, View } from 'react-native';
import { Eye, Info, ScanFace, Smartphone, Smile, Square, Sun, TriangleAlert, User, X } from 'lucide-react-native';
import { CameraPreview } from '../components/CameraPreview';
import { Button, Card, Chip, Header, IconRow, MetricCard, ProgressBar, Screen, StatusPill } from '../components/ui';
import { duration, num } from '../format';
import { colors, tint, type } from '../theme';
import type { Metrics, Settings } from '../types';

type Props = {
  faceFound: boolean;
  elapsedSec: number;
  metrics: Metrics;
  settings: Settings;
  onStop: () => void;
  onPreviewPress?: () => void;
};

/** 03 · Đang giám sát – Tỉnh táo and 05 · Không phát hiện khuôn mặt. */
export function MonitorScreen({ faceFound, elapsedSec, metrics, settings, onStop, onPreviewPress }: Props) {
  const { ear, mar, pitchDeg, eyesClosedSec, noFaceSec } = metrics;
  const eyesOpen = ear != null && ear >= settings.earThreshold;
  const yawning = mar != null && mar >= settings.marThreshold;

  return (
    <Screen>
      <Header
        caption={`Phiên giám sát · ${duration(elapsedSec)}`}
        title="Đang giám sát"
        right={faceFound ? <StatusPill label="Tỉnh táo" color={colors.success} /> : <StatusPill label="Không thấy khuôn mặt" color={colors.warning} />}
      />

      {faceFound ? (
        <>
          <CameraPreview height={300} accent={colors.success} overlay="face" fps={metrics.fps} onPress={onPreviewPress} />

          <View style={styles.metrics}>
            <MetricCard
              icon={Eye}
              label="EAR · Mắt"
              value={num(ear, 2)}
              caption={ear == null ? 'Không có dữ liệu' : eyesOpen ? 'Mắt mở' : 'Mắt nhắm'}
              bar={{ value: (ear ?? 0) / 0.4, color: eyesOpen ? colors.success : colors.danger }}
            />
            <MetricCard
              icon={Smile}
              label="MAR · Miệng"
              value={num(mar, 2)}
              caption={mar == null ? 'Không có dữ liệu' : yawning ? 'Đang ngáp' : 'Bình thường'}
              bar={{ value: mar ?? 0, color: yawning ? colors.warning : colors.success }}
            />
            <MetricCard
              icon={User}
              label="Tư thế đầu"
              value={num(pitchDeg, 0, '°')}
              caption={pitchDeg == null ? 'Không có dữ liệu' : 'Ổn định'}
              bar={{ value: Math.abs(pitchDeg ?? 0) / 45, color: colors.success }}
            />
          </View>

          <Card style={{ gap: 10 }}>
            <View style={styles.between}>
              <Text style={type.bodyMedium}>Thời gian nhắm mắt liên tục</Text>
              <Text style={[type.bodyMedium, { color: colors.success }]}>
                {num(eyesClosedSec, 1, 's')} / {settings.eyesClosedSec.toFixed(1)}s
              </Text>
            </View>
            <ProgressBar value={(eyesClosedSec ?? 0) / settings.eyesClosedSec} color={colors.success} />
          </Card>
        </>
      ) : (
        <>
          <CameraPreview height={250} accent={colors.warning} overlay="guide" fps={metrics.fps} onPress={onPreviewPress}>
            <Text style={[type.display, { color: colors.warning }]}>?</Text>
            <Chip solid color={colors.warning} icon={ScanFace} label={`Không thấy khuôn mặt · ${num(noFaceSec, 0, 's')}`} style={styles.bottomChip} />
          </CameraPreview>

          <Card>
            <View style={styles.cardTitle}>
              <TriangleAlert size={20} color={colors.warning} />
              <Text style={type.headline}>Hãy điều chỉnh vị trí</Text>
            </View>
            <IconRow icon={Smartphone} text="Đặt điện thoại ngang tầm mắt, hướng thẳng vào mặt" />
            <IconRow icon={Sun} text="Bật đèn trong xe hoặc tránh ngược sáng" />
            <IconRow icon={X} text="Không để tay, khẩu trang che khuôn mặt" />
            <View style={styles.note}>
              <Info size={16} color={colors.warning} />
              <Text style={[type.caption, { flex: 1, color: colors.warning }]}>Đây là trạng thái nhận diện, không phải cảnh báo ngủ gật.</Text>
            </View>
          </Card>
        </>
      )}

      <Button label="Dừng giám sát" icon={Square} fillIcon variant="danger" onPress={onStop} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 11 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  bottomChip: { position: 'absolute', bottom: 12, alignSelf: 'center' },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  note: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: tint(colors.warning, 0.14) },
});
