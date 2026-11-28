import type {
  CameraError,
  CameraErrorCode,
  CameraPermissionStatus,
  CameraState,
  FrameInput,
  RawFrame,
} from '../../types/camera';
import type { CameraPlatform } from './CameraPlatform';
import { validateFrame } from './frameValidation';

export type CameraStateListener = (state: CameraState) => void;
/** May return a promise; while it is pending, new frames are dropped (backpressure). */
export type FrameHandler = (frame: FrameInput) => void | Promise<void>;

export interface CameraStats {
  delivered: number;
  droppedInvalid: number;
  droppedBusy: number;
  handlerErrors: number;
}

const ERROR_MESSAGES: Record<CameraErrorCode, string> = {
  PERMISSION_DENIED: 'Camera permission was denied. Allow camera access to start monitoring.',
  PERMISSION_BLOCKED: 'Camera permission is blocked. Enable it for SafetyDriver in system settings.',
  CAMERA_UNAVAILABLE: 'No camera is available, or it is being used by another app.',
  OPEN_FAILED: 'The camera could not be opened.',
  CAMERA_INTERRUPTED: 'The camera was interrupted. Start monitoring again.',
  CLOSE_FAILED: 'The camera could not be released cleanly.',
};

/**
 * Owns camera permission, open/close lifecycle and frame delivery.
 *
 * Rules:
 *  - Never reports 'streaming' unless the camera really opened (FR-01).
 *  - stop() always releases the camera and stops frame delivery immediately (FR-02, NFR-06).
 *  - Errors are surfaced in state; the manager never restarts by itself after an
 *    error — the user must press Start again (FR-07).
 *  - Invalid frames are dropped and counted, never replaced by made-up values.
 */
export class CameraManager {
  private state: CameraState = { status: 'idle', permission: 'not-determined', error: null };
  private listeners = new Set<CameraStateListener>();
  private frameHandler: FrameHandler | null = null;
  /** Bumped on every start/stop/pause so stale async continuations can detect they were superseded. */
  private generation = 0;
  private inBackground = false;
  private busy = false;
  private lastTimestampMs: number | null = null;
  private stats: CameraStats = { delivered: 0, droppedInvalid: 0, droppedBusy: 0, handlerErrors: 0 };

  constructor(private readonly platform: CameraPlatform) {}

  getState(): CameraState {
    return this.state;
  }

  getStats(): CameraStats {
    return { ...this.stats };
  }

  subscribe(listener: CameraStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setFrameHandler(handler: FrameHandler | null): void {
    this.frameHandler = handler;
  }

  /** Start monitoring (or resume when paused). Resolves with the resulting state. */
  async start(): Promise<CameraState> {
    const { status } = this.state;
    if (status === 'requesting-permission' || status === 'opening' || status === 'streaming') {
      return this.state; // already starting/running
    }
    this.resetCounters();
    return this.run(++this.generation, true);
  }

  /** Stop monitoring and release the camera. Safe to call at any time, any number of times. */
  async stop(): Promise<CameraState> {
    this.generation++; // invalidates any in-flight start/open
    this.busy = false;
    this.lastTimestampMs = null;
    this.setState({ status: 'idle', error: null });
    await this.releaseCamera();
    return this.state;
  }

  /** Call when the app goes to background (AppState !== 'active'). */
  async onBackground(): Promise<void> {
    this.inBackground = true;
    if (this.state.status !== 'streaming') return;
    this.generation++;
    this.busy = false;
    this.lastTimestampMs = null;
    this.setState({ status: 'paused', error: null });
    await this.releaseCamera();
  }

  /** Call when the app returns to foreground. Resumes only if monitoring was paused by onBackground. */
  async onForeground(): Promise<void> {
    this.inBackground = false;
    if (this.state.status !== 'paused') return;
    await this.run(++this.generation, false);
  }

  // ---------------------------------------------------------------------------

  private async run(gen: number, allowPermissionPrompt: boolean): Promise<CameraState> {
    try {
      this.setState({ status: 'requesting-permission', error: null });
      let permission = await this.platform.getPermissionStatus();
      if (gen !== this.generation) return this.state;

      if (permission !== 'granted' && permission !== 'blocked' && allowPermissionPrompt) {
        permission = await this.platform.requestPermission();
        if (gen !== this.generation) return this.state;
      }
      this.setState({ permission });
      if (permission !== 'granted') {
        return this.fail(permission === 'blocked' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED');
      }

      if (!(await this.platform.isCameraAvailable())) {
        if (gen !== this.generation) return this.state;
        return this.fail('CAMERA_UNAVAILABLE');
      }
      if (gen !== this.generation) return this.state;

      this.setState({ status: 'opening' });
      try {
        await this.platform.open({
          onFrame: (frame) => this.handleFrame(gen, frame),
          onInterrupted: (reason) => void this.handleInterrupted(gen, reason),
        });
      } catch (e) {
        await this.releaseCamera();
        if (gen !== this.generation) return this.state;
        return this.fail('OPEN_FAILED', e);
      }

      if (gen !== this.generation) {
        // stop()/pause happened while opening: do not leave the camera open.
        await this.releaseCamera();
        return this.state;
      }
      if (this.inBackground) {
        // App went to background while the camera was opening.
        this.generation++;
        this.setState({ status: 'paused', error: null });
        await this.releaseCamera();
        return this.state;
      }
      this.setState({ status: 'streaming', error: null });
      return this.state;
    } catch (e) {
      // getPermissionStatus / requestPermission / isCameraAvailable rejected.
      if (gen !== this.generation) return this.state;
      await this.releaseCamera();
      return this.fail('OPEN_FAILED', e);
    }
  }

  private handleFrame(gen: number, raw: RawFrame): void {
    if (gen !== this.generation || this.state.status !== 'streaming') return; // late frame after stop/pause

    const frame = validateFrame(raw, this.lastTimestampMs);
    if (!frame) {
      this.stats.droppedInvalid++;
      return;
    }
    this.lastTimestampMs = frame.timestampMs;

    if (this.busy) {
      this.stats.droppedBusy++;
      return;
    }
    const handler = this.frameHandler;
    if (!handler) return;

    this.busy = true;
    const done = () => {
      if (gen === this.generation) this.busy = false;
    };
    try {
      const result = handler(frame);
      this.stats.delivered++;
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).then(done, () => {
          this.stats.handlerErrors++;
          done();
        });
      } else {
        done();
      }
    } catch {
      this.stats.handlerErrors++;
      done();
    }
  }

  private async handleInterrupted(gen: number, reason: string): Promise<void> {
    if (gen !== this.generation || this.state.status !== 'streaming') return;
    this.generation++;
    this.busy = false;
    this.lastTimestampMs = null;
    this.setState({
      status: 'error',
      error: { code: 'CAMERA_INTERRUPTED', message: `${ERROR_MESSAGES.CAMERA_INTERRUPTED} (${reason})` },
    });
    await this.releaseCamera();
  }

  private fail(code: CameraErrorCode, cause?: unknown): CameraState {
    const detail = cause instanceof Error && cause.message ? ` (${cause.message})` : '';
    const error: CameraError = { code, message: ERROR_MESSAGES[code] + detail };
    this.setState({ status: 'error', error });
    return this.state;
  }

  private async releaseCamera(): Promise<void> {
    try {
      await this.platform.close();
    } catch (e) {
      // Keep going: report only if nothing more important is already reported.
      if (this.state.status === 'idle') {
        const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
        this.setState({ error: { code: 'CLOSE_FAILED', message: ERROR_MESSAGES.CLOSE_FAILED + detail } });
      }
    }
  }

  private resetCounters(): void {
    this.busy = false;
    this.lastTimestampMs = null;
    this.stats = { delivered: 0, droppedInvalid: 0, droppedBusy: 0, handlerErrors: 0 };
  }

  private setState(patch: Partial<CameraState>): void {
    const next = { ...this.state, ...patch };
    if (next.status === this.state.status && next.permission === this.state.permission && next.error === this.state.error) {
      return; // nothing changed: do not re-render the UI
    }
    this.state = next;
    for (const listener of [...this.listeners]) {
      try {
        listener(this.state);
      } catch {
        // a faulty UI listener must not break the camera
      }
    }
  }
}

export type { CameraPermissionStatus };
