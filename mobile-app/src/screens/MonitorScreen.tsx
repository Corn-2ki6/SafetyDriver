import { Platform, StyleSheet, Text, View } from 'react-native';
import { Eye, Info, ScanFace, Smartphone, Smile, Square, Sun, TriangleAlert, User, X } from 'lucide-react-native';
import { CameraPreview } from '../components/CameraPreview';
import type { CameraFrameEvent } from '../../modules/safetydriver-camera/src';
import { Button, Card, Chip, Header, IconRow, MetricCard, ProgressBar, Screen, StatusPill } from '../components/ui';
import { duration, num } from '../format';
import { colors, tint, type } from '../theme';
import type { Metrics, Settings } from '../types';

type Props = {
  faceFound: boolean | null;
  starting: boolean;
  elapsedSec: number;
  metrics: Metrics;
  settings: Settings;
  onStop: () => void;
  onPreviewPress?: () => void;
  onCameraReady: () => void;
  onCameraError: (message: string) => void;
  onCameraFrame: (frame: CameraFrameEvent) => void;
};

/** Keep the live camera preview visible while waiting for face-analysis results. */
export function MonitorScreen({
  faceFound,
  starting,
  elapsedSec,
  metrics,
  settings,
  onStop,
  onPreviewPress,
  onCameraReady,
  onCameraError,
  onCameraFrame,
}: Props) {
  const { ear, mar, pitchDeg, eyesClosedSec, noFaceSec } = metrics;
  const eyesOpen = ear != null && ear >= settings.earThreshold;
  const yawning = mar != null && mar >= settings.marThreshold;

  return (
    <Screen>
      <Header
        caption={`Phiên giám sát · ${duration(elapsedSec)}`}
        title={
          starting
            ? 'Đang kết nối camera'
            : faceFound === null && Platform.OS === 'web'
              ? 'Camera trực tiếp'
              : 'Đang giám sát'
        }
        right={
          starting
            ? <StatusPill label="Đang khởi tạo" color={colors.warning} />
            : faceFound === null
              ? <StatusPill label="Đang chờ kết quả nhận diện" color={colors.warning} />
              : faceFound
                ? <StatusPill label="Đã nhận diện khuôn mặt" color={colors.success} />
                : <StatusPill label="Không thấy khuôn mặt" color={colors.warning} />
        }
      />

      {faceFound === null ? (
        <>
          <CameraPreview
            height={300}
            accent={starting ? colors.warning : colors.primary}
            cameraActive
            fps={metrics.fps}
            onPress={onPreviewPress}
            onCameraReady={onCameraReady}
            onCameraError={onCameraError}
            onCameraFrame={onCameraFrame}
          />
          <Card>
            <View style={styles.cardTitle}>
              <Info size={20} color={colors.warning} />
              <Text style={type.headline}>
                {starting
                  ? 'Đang khởi tạo camera và bộ nhận diện'
                  : Platform.OS === 'web'
                    ? 'Bản web chỉ hiển thị video trực tiếp'
                    : 'Đang chờ dữ liệu nhận diện'}
              </Text>
            </View>
            <Text style={[type.body, { color: colors.muted }]}>
              {starting
                ? 'Chưa có kết quả nhận diện để đánh giá trạng thái tài xế.'
                : Platform.OS === 'web'
                  ? 'Phân tích khuôn mặt và đo EAR/MAR hiện chỉ hoạt động trong bản Android native.'
                  : 'Chưa nhận được landmarks hợp lệ; ứng dụng chưa đưa ra kết luận về trạng thái tài xế.'}
            </Text>
          </Card>
        </>
      ) : faceFound ? (
        <>
          <CameraPreview
            height={300}
            accent={colors.success}
            overlay="face"
            fps={metrics.fps}
            onPress={onPreviewPress}
            cameraActive
            onCameraReady={onCameraReady}
            onCameraError={onCameraError}
            onCameraFrame={onCameraFrame}
          />

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
          <CameraPreview
            height={250}
            accent={colors.warning}
            overlay="guide"
            fps={metrics.fps}
            onPress={onPreviewPress}
            cameraActive
            onCameraReady={onCameraReady}
            onCameraError={onCameraError}
            onCameraFrame={onCameraFrame}
          >
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
