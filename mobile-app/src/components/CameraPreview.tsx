import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { colors } from '../theme';
import {
  SafetyDriverCameraView,
  isSafetyDriverCameraAvailable,
  type CameraFrameEvent,
} from '../../modules/safetydriver-camera/src';
import { Chip } from './ui';

// Landmark dots from the Figma frame (358 x 300 preview).
type Props = {
  height: number;
  /** Border and overlay colour; omit for the neutral "camera off" look. */
  accent?: string;
  /** 'face' draws the detected-face overlay, 'guide' the dashed "place your face here" oval. */
  overlay?: 'face' | 'guide';
  fps?: number | null;
  children?: ReactNode;
  onPress?: () => void;
  cameraActive?: boolean;
  onCameraReady?: () => void;
  onCameraError?: (message: string) => void;
  onCameraFrame?: (frame: CameraFrameEvent) => void;
};

const CAMERA_ELEMENT_ID = 'safetydriver-camera-preview';

export function CameraPreview({
  height,
  accent,
  overlay,
  fps,
  children,
  onPress,
  cameraActive = false,
  onCameraReady,
  onCameraError,
  onCameraFrame,
}: Props) {
  const shiftY = (height - 300) / 2;

  useEffect(() => {
    if (!cameraActive) return;

    if (Platform.OS === 'android') {
      if (!isSafetyDriverCameraAvailable) {
        onCameraError?.('Native camera module chưa có trong bản cài. Hãy tạo lại development build Android.');
      }
      return;
    }

    if (Platform.OS !== 'web') {
      onCameraError?.('Camera native chưa được tích hợp cho Android/iOS.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      onCameraError?.('Trình duyệt không hỗ trợ truy cập camera. Hãy mở ứng dụng bằng HTTPS hoặc localhost.');
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    const host = document.getElementById(CAMERA_ELEMENT_ID);

    if (!host) {
      onCameraError?.('Không thể khởi tạo vùng hiển thị camera.');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'user' } },
    }).then((mediaStream) => {
      if (disposed) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      stream = mediaStream;
      video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('aria-label', 'Hình ảnh camera trực tiếp');
      Object.assign(video.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        zIndex: '0',
      });
      host.prepend(video);
      video.srcObject = mediaStream;

      video.onloadedmetadata = () => {
        video?.play().then(() => {
          if (!disposed) onCameraReady?.();
        }).catch(() => {
          if (!disposed) onCameraError?.('Trình duyệt không thể phát luồng camera.');
        });
      };

      mediaStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (!disposed) onCameraError?.('Luồng camera đã bị ngắt.');
      }, { once: true });
    }).catch((error: unknown) => {
      if (disposed) return;
      const name = error instanceof DOMException ? error.name : '';
      const message = name === 'NotAllowedError' || name === 'PermissionDeniedError'
        ? 'Quyền camera bị từ chối. Hãy cho phép truy cập camera trong cài đặt trình duyệt rồi thử lại.'
        : name === 'NotFoundError' || name === 'DevicesNotFoundError'
          ? 'Không tìm thấy camera trên thiết bị.'
          : name === 'NotReadableError' || name === 'TrackStartError'
            ? 'Camera đang được ứng dụng khác sử dụng hoặc không thể khởi động.'
            : 'Không thể khởi động camera. Hãy kiểm tra quyền truy cập và thử lại.';
      onCameraError?.(message);
    });

    return () => {
      disposed = true;
      if (video) {
        video.pause();
        video.srcObject = null;
        video.remove();
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraActive, onCameraError, onCameraReady]);

  return (
    <Pressable nativeID={CAMERA_ELEMENT_ID} disabled={!onPress} onPress={onPress} style={[styles.box, { height }, accent ? { borderColor: accent, borderWidth: 2 } : null]}>
      {!cameraActive ? <LinearGradient colors={['#212b40', '#0d1421']} style={[StyleSheet.absoluteFill, { zIndex: -1 }]} /> : null}
      {cameraActive && Platform.OS === 'android' && isSafetyDriverCameraAvailable ? (
        <SafetyDriverCameraView
          active
          style={StyleSheet.absoluteFill}
          onCameraReady={onCameraReady}
          onCameraError={(event) => onCameraError?.(event.nativeEvent.message)}
          onFrame={(event) => onCameraFrame?.(event.nativeEvent)}
        />
      ) : null}
      {overlay && !cameraActive ? (
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
              </>
            ) : (
              <Ellipse cx={179} cy={150} rx={75} ry={95} stroke={accent} strokeWidth={2} strokeDasharray="8 6" fill="none" />
            )}
          </Svg>
        </View>
      ) : null}
      {overlay || cameraActive ? (
        <>
          <Chip
            label={cameraActive ? 'LIVE · Camera trước' : 'DEMO · Camera không hoạt động'}
            dot={cameraActive ? colors.success : colors.warning}
            style={styles.topLeft}
          />
          <Chip label={fps == null ? '— FPS' : `${Math.round(fps)} FPS`} style={styles.topRight} />
        </>
      ) : null}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { position: 'relative', borderRadius: 24, overflow: 'hidden', borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  art: { ...StyleSheet.absoluteFill, alignItems: 'center', zIndex: 1 },
  topLeft: { position: 'absolute', top: 12, left: 12 },
  topRight: { position: 'absolute', top: 12, right: 12 },
});
