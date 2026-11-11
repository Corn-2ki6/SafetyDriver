import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '../theme';
import { Chip } from './ui';

// Landmark dots from the Figma frame (358 x 300 preview).
const LANDMARKS: [number, number][] = [
  [163, 140], [157, 144], [145, 144], [139, 140], [145, 136], [157, 136],
  [137, 124], [144, 121], [151, 120], [158, 121], [165, 124],
  [219, 140], [213, 144], [201, 144], [195, 140], [201, 136], [213, 136],
  [193, 124], [200, 121], [207, 120], [214, 121], [221, 124],
  [179, 152], [179, 159], [179, 166], [179, 173],
  [199, 198], [193, 202], [179, 204], [165, 202], [159, 198], [165, 194], [179, 192], [193, 194],
  [116, 163], [123, 190], [137, 212], [157, 227], [179, 232], [201, 227], [221, 212], [235, 190], [242, 163],
];

type Props = {
  height: number;
  /** Border and overlay colour; omit for the neutral "camera off" look. */
  accent?: string;
  /** 'face' draws the detected-face overlay, 'guide' the dashed "place your face here" oval. */
  overlay?: 'face' | 'guide';
  fps?: number | null;
  children?: ReactNode;
  onPress?: () => void;
};

// shortcut: draws the Figma placeholder illustration, not a real feed. Render the
// VisionCamera view from features/camera behind the overlay once that module exists.
export function CameraPreview({ height, accent, overlay, fps, children, onPress }: Props) {
  const shiftY = (height - 300) / 2;
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.box, { height }, accent ? { borderColor: accent, borderWidth: 2 } : null]}>
      <LinearGradient colors={['#212b40', '#0d1421']} style={[StyleSheet.absoluteFill, { zIndex: -1 }]} />
      {overlay ? (
        <View style={styles.art} pointerEvents="none">
          <Svg width={358} height={height} viewBox={`0 ${-shiftY} 358 ${height}`}>
            {overlay === 'face' ? (
              <>
                <Ellipse cx={179} cy={150} rx={70} ry={90} fill="#33405c" />
                <Ellipse cx={179} cy={315} rx={150} ry={85} fill="#263350" />
                <Path
                  d="M89 70V40h30M239 40h30v30M269 230v30h-30M119 260H89v-30"
                  stroke={accent}
                  strokeWidth={3}
                  fill="none"
                />
                {LANDMARKS.map(([x, y], i) => (
                  <Circle key={i} cx={x} cy={y} r={2} fill={accent} />
                ))}
              </>
            ) : (
              <Ellipse cx={179} cy={150} rx={75} ry={95} stroke={accent} strokeWidth={2} strokeDasharray="8 6" fill="none" />
            )}
          </Svg>
        </View>
      ) : null}
      {overlay ? (
        <>
          <Chip label="LIVE · Camera trước" dot={colors.danger} style={styles.topLeft} />
          <Chip label={fps == null ? '— FPS' : `${Math.round(fps)} FPS`} style={styles.topRight} />
        </>
      ) : null}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 24, overflow: 'hidden', borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  art: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  topLeft: { position: 'absolute', top: 12, left: 12 },
  topRight: { position: 'absolute', top: 12, right: 12 },
});
