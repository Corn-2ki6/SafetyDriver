import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, ScanFace, SlidersVertical } from 'lucide-react-native';
import { colors, type } from '../theme';

export type Tab = 'monitor' | 'history' | 'settings';

const TABS = [
  { key: 'monitor', label: 'Giám sát', icon: ScanFace },
  { key: 'history', label: 'Lịch sử', icon: Clock },
  { key: 'settings', label: 'Cài đặt', icon: SlidersVertical },
] as const;

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
      {TABS.map(({ key, label, icon: Icon }) => {
        const color = key === active ? colors.primary : colors.muted;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: key === active }}>
            <Icon size={24} color={color} />
            <Text style={[type.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 24, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 },
  tab: { alignItems: 'center', gap: 4, minWidth: 80, minHeight: 44 },
});
