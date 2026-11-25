import type { CameraFrameEvent } from '../../../modules/safetydriver-camera/src';

export type BrowserCameraCallbacks = {
  onCameraReady?: () => void;
  onCameraError?: (message: string) => void;
  onCameraFrame?: (frame: CameraFrameEvent) => void;
};

export function startBrowserCamera(
  _host: HTMLElement,
  _callbacks: BrowserCameraCallbacks,
): () => void {
  throw new Error('Browser camera is only available on web.');
}
