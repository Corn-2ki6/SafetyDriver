import type { CameraFrameEvent } from '../../../modules/safetydriver-camera/src';
import { createBrowserFaceLandmarker } from './browserFaceLandmarker';
import type { BrowserFaceLandmarker } from './browserFaceLandmarker';
import type { BrowserCameraCallbacks } from './browserCamera';

export function startBrowserCamera(
  host: HTMLElement,
  callbacks: BrowserCameraCallbacks,
): () => void {
  let disposed = false;
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let frameRequest = 0;
  let landmarker: BrowserFaceLandmarker | null = null;
  let lastInferenceAt = 0;
  let lastVideoTime = -1;
  let lastTimestampMs = 0;

  const cleanup = () => {
    cancelAnimationFrame(frameRequest);
    video?.pause();
    if (video) {
      video.srcObject = null;
      video.remove();
    }
    stream?.getTracks().forEach((track) => track.stop());
    landmarker?.close();
    landmarker = null;
  };

  const fail = (message: string) => {
    if (disposed) return;
    disposed = true;
    cleanup();
    callbacks.onCameraError?.(message);
  };

  const analyzeNextFrame = () => {
    if (disposed || !video || !landmarker) return;
    frameRequest = requestAnimationFrame(analyzeNextFrame);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastVideoTime) return;

    const timestampMs = Math.max(performance.now(), lastTimestampMs + 1);
    if (timestampMs - lastInferenceAt < 100) return;
    lastInferenceAt = timestampMs;
    lastTimestampMs = timestampMs;
    lastVideoTime = video.currentTime;

    try {
      const inferenceStart = performance.now();
      const face = landmarker.detectForVideo(video, timestampMs).faceLandmarks[0];
      const landmarks = face?.map(({ x, y, z }) => ({ x, y, z })) ?? [];
      const frame: CameraFrameEvent = {
        schemaVersion: 1,
        timestampMs,
        width: video.videoWidth,
        height: video.videoHeight,
        rotationApplied: 0,
        mirrored: false,
        inferenceMs: Math.max(0, performance.now() - inferenceStart),
        status: face
          ? landmarks.length === 478 ? 'FACE_DETECTED' : 'INVALID_LANDMARKS'
          : 'NO_FACE',
        landmarks,
      };
      callbacks.onCameraFrame?.(frame);
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : '';
      fail(`Không thể phân tích frame camera trên trình duyệt.${detail}`);
    }
  };

  const start = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'user' } },
      });
      if (disposed) {
        cleanup();
        return;
      }

      landmarker = await createBrowserFaceLandmarker();
      if (disposed) {
        cleanup();
        return;
      }

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
      video.srcObject = stream;
      await video.play();

      if (disposed) return;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        fail('Luồng camera đã bị ngắt.');
      }, { once: true });
      callbacks.onCameraReady?.();
      analyzeNextFrame();
    } catch (error: unknown) {
      if (disposed) return;
      const name = error instanceof DOMException ? error.name : '';
      const message = name === 'NotAllowedError' || name === 'PermissionDeniedError'
        ? 'Quyền camera bị từ chối. Hãy cho phép truy cập camera trong cài đặt trình duyệt rồi thử lại.'
        : name === 'NotFoundError' || name === 'DevicesNotFoundError'
          ? 'Không tìm thấy camera trên thiết bị.'
          : name === 'NotReadableError' || name === 'TrackStartError'
            ? 'Camera đang được ứng dụng khác sử dụng hoặc không thể khởi động.'
            : 'Không thể khởi tạo camera hoặc bộ nhận diện. Hãy kiểm tra kết nối mạng và tải lại trang.';
      fail(message);
    }
  };

  void start();
  return () => {
    disposed = true;
    cleanup();
  };
}
