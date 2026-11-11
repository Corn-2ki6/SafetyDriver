import { StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { RefreshCw } from 'lucide-react-native';
import { Button, Card, Header, Screen } from '../components/ui';
import { colors, type } from '../theme';
import { defaultSettings, type Settings } from '../types';

type NumberKey = 'eyesClosedSec' | 'earThreshold' | 'marThreshold' | 'volume';
type SliderDef = { key: NumberKey; label: string; min: number; max: number; step: number; show: (v: number) => string };

const THRESHOLDS: SliderDef[] = [
  { key: 'eyesClosedSec', label: 'Thời gian nhắm mắt', min: 1, max: 3.5, step: 0.1, show: (v) => `${v.toFixed(1)} s` },
  { key: 'earThreshold', label: 'Ngưỡng EAR (mắt)', min: 0.15, max: 0.35, step: 0.01, show: (v) => v.toFixed(2) },
  { key: 'marThreshold', label: 'Ngưỡng MAR (ngáp)', min: 0.3, max: 0.8, step: 0.01, show: (v) => v.toFixed(2) },
];
const VOLUME: SliderDef = { key: 'volume', label: 'Âm lượng chuông', min: 0, max: 1, step: 0.05, show: (v) => `${Math.round(v * 100)}%` };

/** 08 · Cài đặt cảnh báo. */
export function SettingsScreen({ settings, onChange }: { settings: Settings; onChange: (next: Settings) => void }) {
  const slider = ({ key, label, min, max, step, show }: SliderDef) => (
    <View key={key} style={{ gap: 6 }}>
      <View style={styles.between}>
        <Text style={type.bodyMedium}>{label}</Text>
        <Text style={[type.bodyMedium, { color: colors.primary }]}>{show(settings[key])}</Text>
      </View>
      <Slider
        accessibilityLabel={label}
        value={settings[key]}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={(v) => onChange({ ...settings, [key]: v })}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.surface2}
        thumbTintColor={colors.white}
      />
    </View>
  );

  const toggle = (key: 'flashBorder' | 'saveHistory', label: string, hint: string) => (
    <View style={[styles.between, { alignItems: 'center' }]}>
      <View style={{ flex: 1 }}>
        <Text style={type.bodyMedium}>{label}</Text>
        <Text style={type.caption}>{hint}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={settings[key]}
        onValueChange={(v) => onChange({ ...settings, [key]: v })}
        trackColor={{ true: colors.success, false: colors.surface2 }}
        thumbColor={colors.white}
      />
    </View>
  );

  return (
    <Screen>
      <Header caption="Tùy chỉnh thông số cảnh báo" title="Cài đặt" />
      <Card style={{ gap: 16 }}>
        <Text style={type.headline}>Ngưỡng phát hiện</Text>
        {THRESHOLDS.map(slider)}
      </Card>
      <Card style={{ gap: 16 }}>
        <Text style={type.headline}>Hình thức cảnh báo</Text>
        {slider(VOLUME)}
        {toggle('flashBorder', 'Viền đỏ nhấp nháy', 'Hiển thị khi có cảnh báo')}
        {toggle('saveHistory', 'Lưu lịch sử cảnh báo', 'Tự động xóa sau 3 ngày')}
      </Card>
      <View style={{ flex: 1 }} />
      <Button label="Khôi phục mặc định" icon={RefreshCw} variant="secondary" onPress={() => onChange(defaultSettings)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
