import { Linking, StyleSheet, Text, View } from 'react-native';
import { CameraOff, RefreshCw, SlidersVertical } from 'lucide-react-native';
import { Button, Card, Header, IconCircle, Screen, StatusPill } from '../components/ui';
import { clock } from '../format';
import { colors, type } from '../theme';

const STEPS = [
  'Đóng các ứng dụng khác đang dùng camera',
  'Kiểm tra quyền camera trong Cài đặt điện thoại',
  'Nhấn “Thử lại” để khởi động lại giám sát',
];

/** 06 · Lỗi giám sát. */
export function ErrorScreen({ code, message, at, onRetry }: { code: string; message: string; at: Date; onRetry: () => void }) {
  return (
    <Screen>
      <Header title="Giám sát" right={<StatusPill label="Lỗi giám sát" color={colors.danger} />} />

      <View style={styles.hero}>
        <IconCircle icon={CameraOff} size={84} color={colors.danger} />
        <Text style={[type.title, styles.center]}>Camera bị gián đoạn</Text>
        <Text style={[type.body, styles.center, { color: colors.muted }]}>{message}</Text>
      </View>

      <Card>
        <Text style={type.headline}>Cách khắc phục</Text>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={type.label}>{i + 1}</Text>
            </View>
            <Text style={[type.body, { flex: 1 }]}>{step}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.code}>
        <Text style={type.caption}>Mã lỗi: {code}</Text>
        <Text style={type.caption}>{clock(at, true)}</Text>
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Thử lại" icon={RefreshCw} onPress={onRetry} />
      <Button label="Mở cài đặt quyền" icon={SlidersVertical} variant="secondary" onPress={() => Linking.openSettings()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingTop: 8 },
  center: { textAlign: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  code: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
});
