import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraOff, CircleCheck, Eye, Info, Play, ShieldCheck, Smartphone, Sun } from 'lucide-react-native';
import { CameraPreview } from '../components/CameraPreview';
import { Button, Card, Header, IconCircle, IconRow, Screen, StatusPill } from '../components/ui';
import { colors, type } from '../theme';

const PRIVACY = [
  'Hình ảnh chỉ được xử lý trên thiết bị, không tải lên máy chủ',
  'Camera tắt trong vòng 1 giây sau khi bạn dừng giám sát',
];

/** 01 · Trang chủ, plus the 02 · camera permission bottom sheet. */
export function HomeScreen({ onStart }: { onStart: () => void }) {
  const [asking, setAsking] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <Header caption="Xin chào, tài xế 👋" title="SafetyDriver" right={<IconCircle icon={ShieldCheck} />} />

      <CameraPreview height={210}>
        <View style={styles.pill}>
          <StatusPill label="Chưa giám sát" />
        </View>
        <CameraOff size={40} color={colors.muted} />
        <Text style={[type.bodyMedium, { marginTop: 10 }]}>Camera đang tắt</Text>
        <Text style={[type.caption, { marginTop: 10 }]}>Camera chỉ bật khi bạn bắt đầu giám sát</Text>
      </CameraPreview>

      <Card>
        <Text style={type.headline}>Trước khi bắt đầu</Text>
        <IconRow circle icon={Smartphone} text="Cố định điện thoại, camera trước hướng vào mặt" />
        <IconRow circle icon={Sun} text="Đủ ánh sáng, tránh ngược sáng" />
        <IconRow circle icon={Eye} text="Không đeo kính râm che mắt" />
      </Card>

      <Button label="Bắt đầu giám sát" icon={Play} fillIcon onPress={() => setAsking(true)} />

      <View style={styles.disclaimer}>
        <Info size={16} color={colors.muted} />
        <Text style={[type.caption, { flex: 1 }]}>
          SafetyDriver chỉ hỗ trợ cảnh báo, không bảo đảm an toàn tuyệt đối và không thay thế việc nghỉ ngơi.
        </Text>
      </View>

      <Modal visible={asking} transparent animationType="slide" onRequestClose={() => setAsking(false)}>
        <Pressable style={styles.scrim} onPress={() => setAsking(false)} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 36 }]}>
          <View style={styles.handle} />
          <IconCircle icon={Camera} size={72} />
          <Text style={[type.title, styles.centerText]}>Cho phép truy cập camera</Text>
          <Text style={[type.body, styles.centerText, { color: colors.muted }]}>
            {Platform.OS === 'android'
              ? 'SafetyDriver dùng camera trước và phân tích khuôn mặt trên thiết bị Android. EAR/MAR và cảnh báo là tính năng thử nghiệm, không thay thế việc nghỉ ngơi.'
              : 'Camera trực tiếp có thể dùng trên web; phân tích khuôn mặt hiện chỉ được tích hợp trong bản Android native.'}
          </Text>
          <View style={styles.privacy}>
            {PRIVACY.map((text) => (
              <View key={text} style={styles.privacyRow}>
                <CircleCheck size={18} color={colors.success} />
                <Text style={[type.caption, { flex: 1, color: colors.text }]}>{text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Button
              label="Cho phép dùng camera"
              icon={Camera}
              fillIcon
              onPress={() => {
                setAsking(false);
                onStart();
              }}
            />
            <Button label="Để sau" variant="ghost" onPress={() => setAsking(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pill: { position: 'absolute', top: 12, left: 12 },
  disclaimer: { flexDirection: 'row', gap: 8 },
  scrim: { flex: 1, backgroundColor: 'rgba(5, 9, 18, 0.7)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, alignItems: 'center', gap: 16, marginTop: -28 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border },
  centerText: { textAlign: 'center' },
  privacy: { alignSelf: 'stretch', backgroundColor: colors.surface2, borderRadius: 16, padding: 14, gap: 10 },
  privacyRow: { flexDirection: 'row', gap: 10 },
  actions: { alignSelf: 'stretch', gap: 16 },
});
