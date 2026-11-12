import { CameraManager } from '../../src/features/camera/CameraManager';
import type { CameraState } from '../../src/types/camera';
import { FakePlatform, deferred, makeFrame } from './fakePlatform';

function setup() {
  const platform = new FakePlatform();
  const manager = new CameraManager(platform);
  return { platform, manager };
}

describe('CameraManager – permission and start (FR-01)', () => {
  it('starts streaming when permission is already granted', async () => {
    const { platform, manager } = setup();
    const state = await manager.start();
    expect(state.status).toBe('streaming');
    expect(state.permission).toBe('granted');
    expect(state.error).toBeNull();
    expect(platform.requestCalls).toBe(0);
    expect(platform.isOpen).toBe(true);
  });

  it('asks for permission when not determined, then streams if granted', async () => {
    const { platform, manager } = setup();
    platform.permission = 'not-determined';
    const state = await manager.start();
    expect(platform.requestCalls).toBe(1);
    expect(state.status).toBe('streaming');
  });

  it('does not open the camera when permission is denied', async () => {
    const { platform, manager } = setup();
    platform.permission = 'not-determined';
    platform.permissionAfterRequest = 'denied';
    const state = await manager.start();
    expect(state.status).toBe('error');
    expect(state.error?.code).toBe('PERMISSION_DENIED');
    expect(platform.openCalls).toBe(0);
  });

  it('reports PERMISSION_BLOCKED without prompting again', async () => {
    const { platform, manager } = setup();
    platform.permission = 'blocked';
    const state = await manager.start();
    expect(state.error?.code).toBe('PERMISSION_BLOCKED');
    expect(platform.requestCalls).toBe(0);
    expect(platform.openCalls).toBe(0);
  });

  it('reports CAMERA_UNAVAILABLE when no camera can be used', async () => {
    const { platform, manager } = setup();
    platform.available = false;
    const state = await manager.start();
    expect(state.error?.code).toBe('CAMERA_UNAVAILABLE');
    expect(platform.openCalls).toBe(0);
  });

  it('reports OPEN_FAILED and never claims streaming when open() rejects', async () => {
    const { platform, manager } = setup();
    platform.openError = new Error('camera in use');
    const seen: string[] = [];
    manager.subscribe((s) => seen.push(s.status));
    const state = await manager.start();
    expect(state.status).toBe('error');
    expect(state.error?.code).toBe('OPEN_FAILED');
    expect(state.error?.message).toContain('camera in use');
    expect(seen).not.toContain('streaming');
    expect(platform.isOpen).toBe(false);
  });

  it('reports an error instead of throwing when the permission API rejects', async () => {
    const { platform, manager } = setup();
    platform.getPermissionError = new Error('native module missing');
    const state = await manager.start();
    expect(state.status).toBe('error');
    expect(state.error?.code).toBe('OPEN_FAILED');
  });

  it('can start again after an error once the cause is fixed (manual restart)', async () => {
    const { platform, manager } = setup();
    platform.available = false;
    await manager.start();
    platform.available = true;
    const state = await manager.start();
    expect(state.status).toBe('streaming');
    expect(state.error).toBeNull();
  });

  it('ignores a second start() while already streaming', async () => {
    const { platform, manager } = setup();
    await manager.start();
    await manager.start();
    expect(platform.openCalls).toBe(1);
  });

  it('opens the camera only once for two concurrent start() calls', async () => {
    const { platform, manager } = setup();
    await Promise.all([manager.start(), manager.start()]);
    expect(platform.openCalls).toBe(1);
  });
});

describe('CameraManager – stop and release (FR-02, NFR-06)', () => {
  it('releases the camera and returns to idle', async () => {
    const { platform, manager } = setup();
    await manager.start();
    const state = await manager.stop();
    expect(state.status).toBe('idle');
    expect(platform.isOpen).toBe(false);
  });

  it('is safe to call stop() when never started or called twice', async () => {
    const { manager } = setup();
    await expect(manager.stop()).resolves.toMatchObject({ status: 'idle' });
    await expect(manager.stop()).resolves.toMatchObject({ status: 'idle' });
  });

  it('delivers no frames after stop()', async () => {
    const { platform, manager } = setup();
    const handler = jest.fn();
    manager.setFrameHandler(handler);
    await manager.start();
    platform.emitFrame(makeFrame({ timestampMs: 1 }));
    await manager.stop();
    platform.emitFrame(makeFrame({ timestampMs: 2 }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('closes the camera if stop() is called while it is still opening', async () => {
    const { platform, manager } = setup();
    const gate = deferred();
    platform.openGate = gate.promise;
    const starting = manager.start();
    await Promise.resolve();
    await manager.stop();
    gate.resolve();
    await starting;
    expect(manager.getState().status).toBe('idle');
    expect(platform.isOpen).toBe(false);
  });

  it('does not open the camera if stop() is called while waiting for the permission prompt', async () => {
    const { platform, manager } = setup();
    platform.permission = 'not-determined';
    const starting = manager.start();
    await manager.stop();
    await starting;
    expect(manager.getState().status).toBe('idle');
    expect(platform.openCalls).toBe(0);
  });

  it('can start again after stop()', async () => {
    const { manager } = setup();
    await manager.start();
    await manager.stop();
    const state = await manager.start();
    expect(state.status).toBe('streaming');
  });

  it('still ends idle and reports CLOSE_FAILED if release throws', async () => {
    const { platform, manager } = setup();
    await manager.start();
    platform.closeError = new Error('native close failed');
    const state = await manager.stop();
    expect(state.status).toBe('idle');
    expect(state.error?.code).toBe('CLOSE_FAILED');
  });
});

describe('CameraManager – frame delivery (CAM-03)', () => {
  it('delivers valid frames to the handler', async () => {
    const { platform, manager } = setup();
    const handler = jest.fn();
    manager.setFrameHandler(handler);
    await manager.start();
    platform.emitFrame(makeFrame({ timestampMs: 10 }));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ timestampMs: 10, width: 640 }));
    expect(manager.getStats().delivered).toBe(1);
  });

  it('drops invalid frames and counts them, without calling the handler', async () => {
    const { platform, manager } = setup();
    const handler = jest.fn();
    manager.setFrameHandler(handler);
    await manager.start();
    platform.emitFrame(makeFrame({ width: 0 }));
    platform.emitFrame(makeFrame({ timestampMs: NaN }));
    expect(handler).not.toHaveBeenCalled();
    expect(manager.getStats().droppedInvalid).toBe(2);
  });

  it('drops out-of-order frames', async () => {
    const { platform, manager } = setup();
    const handler = jest.fn();
    manager.setFrameHandler(handler);
    await manager.start();
    platform.emitFrame(makeFrame({ timestampMs: 100 }));
    platform.emitFrame(makeFrame({ timestampMs: 50 }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(manager.getStats().droppedInvalid).toBe(1);
  });

  it('drops frames while the previous one is still being processed, then recovers', async () => {
    const { platform, manager } = setup();
    const gate = deferred();
    const handler = jest.fn(() => gate.promise);
    manager.setFrameHandler(handler);
    await manager.start();

    platform.emitFrame(makeFrame({ timestampMs: 1 }));
    platform.emitFrame(makeFrame({ timestampMs: 2 }));
    platform.emitFrame(makeFrame({ timestampMs: 3 }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(manager.getStats().droppedBusy).toBe(2);

    gate.resolve();
    await gate.promise;
    await Promise.resolve();
    platform.emitFrame(makeFrame({ timestampMs: 4 }));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('survives a throwing or rejecting handler and keeps streaming', async () => {
    const { platform, manager } = setup();
    let n = 0;
    manager.setFrameHandler(() => {
      n++;
      if (n === 1) throw new Error('sync boom');
      return Promise.reject(new Error('async boom'));
    });
    await manager.start();
    platform.emitFrame(makeFrame({ timestampMs: 1 }));
    platform.emitFrame(makeFrame({ timestampMs: 2 }));
    await Promise.resolve();
    await Promise.resolve();
    platform.emitFrame(makeFrame({ timestampMs: 3 }));
    expect(manager.getState().status).toBe('streaming');
    expect(manager.getStats().handlerErrors).toBe(2);
    expect(n).toBe(3);
  });

  it('does not crash when frames arrive with no handler set', async () => {
    const { platform, manager } = setup();
    await manager.start();
    expect(() => platform.emitFrame(makeFrame())).not.toThrow();
  });

  it('accepts a fresh timestamp sequence after restart', async () => {
    const { platform, manager } = setup();
    const handler = jest.fn();
    manager.setFrameHandler(handler);
    await manager.start();
    platform.emitFrame(makeFrame({ timestampMs: 5000 }));
    await manager.stop();
    await manager.start();
    platform.emitFrame(makeFrame({ timestampMs: 10 }));
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe('CameraManager – interruptions (FR-07, NFR-02)', () => {
  it('moves to error CAMERA_INTERRUPTED, releases the camera and does not restart by itself', async () => {
    const { platform, manager } = setup();
    await manager.start();
    platform.emitInterruption('taken by another app');
    await Promise.resolve();
    const state = manager.getState();
    expect(state.status).toBe('error');
    expect(state.error?.code).toBe('CAMERA_INTERRUPTED');
    expect(platform.isOpen).toBe(false);
    expect(platform.openCalls).toBe(1);
  });

  it('ignores an interruption that arrives after stop()', async () => {
    const { platform, manager } = setup();
    await manager.start();
    await manager.stop();
    platform.emitInterruption();
    expect(manager.getState().status).toBe('idle');
  });
});

describe('CameraManager – app lifecycle (CAM-04)', () => {
  it('releases the camera in background and resumes in foreground', async () => {
    const { platform, manager } = setup();
    await manager.start();
    await manager.onBackground();
    expect(manager.getState().status).toBe('paused');
    expect(platform.isOpen).toBe(false);

    await manager.onForeground();
    expect(manager.getState().status).toBe('streaming');
    expect(platform.isOpen).toBe(true);
  });

  it('delivers no frames while paused', async () => {
    const { platform, manager } = setup();
    const handler = jest.fn();
    manager.setFrameHandler(handler);
    await manager.start();
    await manager.onBackground();
    platform.emitFrame(makeFrame({ timestampMs: 1 }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing on background/foreground when monitoring was not running', async () => {
    const { platform, manager } = setup();
    await manager.onBackground();
    await manager.onForeground();
    expect(manager.getState().status).toBe('idle');
    expect(platform.openCalls).toBe(0);
  });

  it('does not resume after the user stopped while paused', async () => {
    const { platform, manager } = setup();
    await manager.start();
    await manager.onBackground();
    await manager.stop();
    await manager.onForeground();
    expect(manager.getState().status).toBe('idle');
    expect(platform.openCalls).toBe(1);
  });

  it('reports an error on resume if permission was revoked meanwhile, without prompting', async () => {
    const { platform, manager } = setup();
    await manager.start();
    await manager.onBackground();
    platform.permission = 'denied';
    await manager.onForeground();
    expect(manager.getState().status).toBe('error');
    expect(manager.getState().error?.code).toBe('PERMISSION_DENIED');
    expect(platform.requestCalls).toBe(0);
  });

  it('pauses instead of streaming if the app went to background while the camera was opening', async () => {
    const { platform, manager } = setup();
    const gate = deferred();
    platform.openGate = gate.promise;
    const starting = manager.start();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await manager.onBackground();
    gate.resolve();
    await starting;
    expect(manager.getState().status).toBe('paused');
    expect(platform.isOpen).toBe(false);
  });
});

describe('CameraManager – state notifications', () => {
  it('notifies subscribers in order and supports unsubscribe', async () => {
    const { manager } = setup();
    const seen: string[] = [];
    const off = manager.subscribe((s: CameraState) => {
      if (seen[seen.length - 1] !== s.status) seen.push(s.status); // status changes only
    });
    await manager.start();
    off();
    await manager.stop();
    expect(seen).toEqual(['requesting-permission', 'opening', 'streaming']);
  });

  it('keeps working if a subscriber throws', async () => {
    const { manager } = setup();
    manager.subscribe(() => {
      throw new Error('ui bug');
    });
    const state = await manager.start();
    expect(state.status).toBe('streaming');
  });
});
