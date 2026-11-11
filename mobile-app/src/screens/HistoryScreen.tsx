import { StyleSheet, Text, View } from 'react-native';
import { Clock, EyeOff, Smile, User } from 'lucide-react-native';
import { Card, Header, IconCircle, MetricCard, Screen } from '../components/ui';
import { clock, dayLabel } from '../format';
import { colors, type } from '../theme';
import type { AlertEvent, AlertKind } from '../types';

const KINDS: Record<AlertKind, { title: string; color: string }> = {
  eyesClosed: { title: 'Nhắm mắt kéo dài', color: colors.danger },
  yawn: { title: 'Phát hiện ngáp', color: colors.warning },
  headNod: { title: 'Gục đầu / gật gù', color: colors.primary },
};

/** 07 · Lịch sử cảnh báo. `events` must be sorted newest first. */
export function HistoryScreen({ events }: { events: AlertEvent[] }) {
  const count = (kind: AlertKind) => String(events.filter((e) => e.kind === kind).length);

  return (
    <Screen>
      <Header caption="Lưu tối đa 3 ngày gần nhất" title="Lịch sử cảnh báo" right={<IconCircle icon={Clock} />} />

      <View style={styles.summary}>
        <MetricCard icon={EyeOff} label="Nhắm mắt" value={count('eyesClosed')} caption="lần" />
        <MetricCard icon={Smile} label="Ngáp" value={count('yawn')} caption="lần" />
        <MetricCard icon={User} label="Gục đầu" value={count('headNod')} caption="lần" />
      </View>

      {events.length === 0 ? <Text style={[type.caption, styles.empty]}>Chưa có cảnh báo nào.</Text> : null}

      {events.map((event, i) => {
        const day = dayLabel(event.at);
        const { title, color } = KINDS[event.kind];
        return (
          <View key={event.id} style={styles.group}>
            {i === 0 || dayLabel(events[i - 1].at) !== day ? <Text style={[type.label, styles.day]}>{day}</Text> : null}
            <Card style={styles.item}>
              <View style={[styles.swatch, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={type.bodyMedium}>{title}</Text>
                <Text style={type.caption}>{event.detail}</Text>
              </View>
              <Text style={type.caption}>{clock(event.at)}</Text>
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 11 },
  empty: { textAlign: 'center', paddingVertical: 24 },
  group: { gap: 14, marginTop: -6 },
  day: { color: colors.muted, marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14 },
  swatch: { width: 28, height: 28, borderRadius: 8 },
});
