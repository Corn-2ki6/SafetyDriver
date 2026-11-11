import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import { colors, tint, type } from '../theme';

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      {footer}
    </View>
  );
}

export function Header({ caption, title, right }: { caption?: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        {caption ? <Text style={type.caption}>{caption}</Text> : null}
        <Text style={type.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function IconCircle({ icon: Icon, size = 44, color = colors.primary }: { icon: LucideIcon; size?: number; color?: string }) {
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint(color) }]}>
      <Icon size={Math.round(size * 0.46)} color={color} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost';
  /** Solid glyph (play, stop, camera) instead of an outline. */
  fillIcon?: boolean;
};

export function Button({ label, onPress, icon: Icon, variant = 'primary', fillIcon }: ButtonProps) {
  const filled = variant === 'primary' || variant === 'danger';
  const fg = filled ? colors.white : variant === 'ghost' ? colors.primary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'secondary' && styles.buttonSecondary,
        pressed && { opacity: 0.8 },
      ]}
    >
      {Icon ? <Icon size={24} color={fg} fill={fillIcon ? fg : 'none'} /> : null}
      <Text style={[type.headline, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Small rounded label. `solid` fills with the colour; otherwise it is tinted. */
export function Chip({ label, color, icon: Icon, dot, solid, style }: { label: string; color?: string; icon?: LucideIcon; dot?: string; solid?: boolean; style?: ViewStyle }) {
  const bg = !color ? colors.bg : solid ? color : tint(color, 0.2);
  const fg = !color ? colors.text : solid ? (color === colors.warning ? colors.bg : colors.white) : color;
  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {Icon ? <Icon size={14} color={fg} /> : null}
      <Text style={[type.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatusPill({ label, color = colors.muted }: { label: string; color?: string }) {
  return <Chip label={label} color={color} dot={color} style={{ paddingVertical: 6 }} />;
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function MetricCard({ icon: Icon, label, value, caption, bar }: { icon: LucideIcon; label: string; value: string; caption: string; bar?: { value: number; color: string } }) {
  return (
    <Card style={styles.metric}>
      <View style={styles.row}>
        <Icon size={14} color={colors.muted} />
        <Text style={[type.label, { color: colors.muted }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={type.title}>{value}</Text>
      {bar ? <ProgressBar value={bar.value} color={bar.color} /> : null}
      <Text style={type.caption}>{caption}</Text>
    </Card>
  );
}

export function IconRow({ icon, text, circle }: { icon: LucideIcon; text: string; circle?: boolean }) {
  const Icon = icon;
  return (
    <View style={[styles.row, { gap: 12 }]}>
      {circle ? <IconCircle icon={icon} size={32} /> : <Icon size={18} color={colors.muted} />}
      <Text style={[circle ? type.body : type.caption, styles.flex, !circle && { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 14 },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
  button: { height: 56, borderRadius: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonSecondary: { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.surface2, overflow: 'hidden', alignSelf: 'stretch' },
  barFill: { height: 8, borderRadius: 4 },
  metric: { flex: 1, padding: 12, gap: 6 },
});
