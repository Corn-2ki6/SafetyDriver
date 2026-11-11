import type { TextStyle } from 'react-native';

// Tokens from the Figma file "SafetyDriver – Drowsiness Warning App".
export const colors = {
  bg: '#0b1220',
  surface: '#131c2e',
  surface2: '#1c2740',
  border: '#26324d',
  text: '#f1f5f9',
  muted: '#94a3b8',
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
};

/** Translucent version of a 6-digit hex colour, for tinted icon circles and chips. */
export const tint = (hex: string, alpha = 0.16) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const font = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  color: colors.text,
});

export const type = {
  display: font('BeVietnamPro_800ExtraBold', 28, 36),
  title: font('BeVietnamPro_700Bold', 22, 30),
  headline: font('BeVietnamPro_600SemiBold', 17, 24),
  body: font('BeVietnamPro_400Regular', 15, 22),
  bodyMedium: font('BeVietnamPro_500Medium', 15, 22),
  caption: { ...font('BeVietnamPro_400Regular', 13, 18), color: colors.muted },
  label: font('BeVietnamPro_600SemiBold', 12, 16),
};
