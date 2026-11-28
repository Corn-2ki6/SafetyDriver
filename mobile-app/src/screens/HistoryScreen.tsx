
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, EyeOff, Smile, User, Trash2 } from 'lucide-react-native';

import {
  Card,
  Header,
  IconCircle,
  MetricCard,
  Screen,
} from '../components/ui';

import { clock, dayLabel } from '../format';
import { colors, type } from '../theme';
import type { AlertEvent, AlertKind } from '../types';

const KINDS: Record<AlertKind, { title: string; color: string }> = {
  eyesClosed: {
    title: 'Nhắm mắt kéo dài',
    color: colors.danger,
  },
  yawn: {
    title: 'Phát hiện ngáp',
    color: colors.warning,
  },
  headNod: {
    title: 'Gục đầu / gật gù',
    color: colors.primary,
  },
};

type HistoryScreenProps = {
  events: AlertEvent[];
  onClear: () => void;
};

/** 07 · Lịch sử cảnh báo */
export function HistoryScreen({
  events,
  onClear,
}: HistoryScreenProps) {
  const count = (kind: AlertKind) =>
    String(events.filter((event) => event.kind === kind).length);

  // Xác nhận trước khi xóa lịch sử
  const confirmClear = () => {
    if (events.length === 0) return;

    Alert.alert(
      'Xóa lịch sử cảnh báo?',
      'Toàn bộ lịch sử cảnh báo sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: onClear,
        },
      ],
    );
  };

  return (
    <Screen>
      <Header
        caption="Lưu tối đa 3 ngày gần nhất"
        title="Lịch sử cảnh báo"
        right={<IconCircle icon={Clock} />}
      />

      {/* Thống kê cảnh báo */}
      <View style={styles.summary}>
        <MetricCard
          icon={EyeOff}
          label="Nhắm mắt"
          value={count('eyesClosed')}
          caption="lần"
        />

        <MetricCard
          icon={Smile}
          label="Ngáp"
          value={count('yawn')}
          caption="lần"
        />

        <MetricCard
          icon={User}
          label="Gục đầu"
          value={count('headNod')}
          caption="lần"
        />
      </View>

      {/* Nút xóa lịch sử */}
      <Pressable
        onPress={confirmClear}
        disabled={events.length === 0}
        style={[
          styles.clearButton,
          events.length === 0 && styles.disabledButton,
        ]}
      >
        <Trash2 size={17} color={colors.danger} />

        <Text style={styles.clearText}>
          Xóa lịch sử cảnh báo
        </Text>
      </Pressable>

      {/* Không có dữ liệu */}
      {events.length === 0 ? (
        <Text style={[type.caption, styles.empty]}>
          Chưa có cảnh báo nào.
        </Text>
      ) : null}

      {/* Danh sách cảnh báo */}
      {events.map((event, index) => {
        const day = dayLabel(event.at);
        const { title, color } = KINDS[event.kind];

        return (
          <View key={event.id} style={styles.group}>
            {index === 0 ||
            dayLabel(events[index - 1].at) !== day ? (
              <Text style={[type.label, styles.day]}>
                {day}
              </Text>
            ) : null}

            <Card style={styles.item}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                ]}
              />

              <View style={{ flex: 1 }}>
                <Text style={type.bodyMedium}>
                  {title}
                </Text>

                <Text style={type.caption}>
                  {event.detail}
                </Text>
              </View>

              <Text style={type.caption}>
                {clock(event.at)}
              </Text>
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: 11,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: 12,
    marginBottom: 12,
  },

  clearText: {
    color: colors.danger,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.4,
  },

  empty: {
    textAlign: 'center',
    paddingVertical: 24,
  },

  group: {
    gap: 14,
    marginTop: -6,
  },

  day: {
    color: colors.muted,
    marginTop: 6,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },

  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
});
