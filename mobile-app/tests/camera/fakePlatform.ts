import type { CameraPermissionStatus, RawFrame } from '../../src/types/camera';
import type { CameraPlatform } from '../../src/features/camera/CameraPlatform';

export function makeFrame(overrides: Partial<RawFrame> = {}): RawFrame {
  return {
    timestampMs: 1000,
    width: 640,
    height: 480,
    orientation: 0,
    pixelFormat: 'yuv',
    handle: {},
    ...overrides,
  };
}

/** Controllable test double for CameraPlatform. */
export class FakePlatform implements CameraPlatform {
  permission: CameraPermissionStatus = 'granted';
  permissionAfterRequest: CameraPermissionStatus = 'granted';
  available = true;
  openError: Error | null = null;
  closeError: Error | null = null;
  getPermissionError: Error | null = null;
  /** When set, open() waits for this promise before resolving. */
  openGate: Promise<void> | null = null;

  requestCalls = 0;
  openCalls = 0;
  closeCalls = 0;
  isOpen = false;

  private onFrame: ((f: RawFrame) => void) | null = null;
  private onInterrupted: ((r: string) => void) | null = null;

  async getPermissionStatus() {
    if (this.getPermissionError) throw this.getPermissionError;
    return this.permission;
  }
  async requestPermission() {
    this.requestCalls++;
    this.permission = this.permissionAfterRequest;
    return this.permission;
  }
  async isCameraAvailable() {
    return this.available;
  }
  async open(handlers: { onFrame: (f: RawFrame) => void; onInterrupted: (r: string) => void }) {
    this.openCalls++;
    if (this.openGate) await this.openGate;
    if (this.openError) throw this.openError;
    this.isOpen = true;
    this.onFrame = handlers.onFrame;
    this.onInterrupted = handlers.onInterrupted;
  }
  async close() {
    this.closeCalls++;
    if (this.closeError) throw this.closeError;
    this.isOpen = false;
  }

  emitFrame(f: RawFrame) {
    this.onFrame?.(f);
  }
  emitInterruption(reason = 'camera disconnected') {
    this.onInterrupted?.(reason);
  }
}

export function deferred<T = void>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
