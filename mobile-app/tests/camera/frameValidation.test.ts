import { validateFrame } from '../../src/features/camera/frameValidation';
import { makeFrame } from './fakePlatform';

describe('validateFrame', () => {
  it('accepts a well-formed frame', () => {
    const f = makeFrame({ orientation: 90 });
    expect(validateFrame(f, null)).toEqual(f);
  });

  it('accepts all four orientations', () => {
    for (const o of [0, 90, 180, 270]) {
      expect(validateFrame(makeFrame({ orientation: o }), null)).not.toBeNull();
    }
  });

  it.each([
    ['zero width', { width: 0 }],
    ['negative height', { height: -1 }],
    ['fractional width', { width: 640.5 }],
    ['NaN width', { width: NaN }],
    ['unsupported orientation', { orientation: 45 }],
    ['NaN timestamp', { timestampMs: NaN }],
    ['Infinity timestamp', { timestampMs: Infinity }],
    ['negative timestamp', { timestampMs: -5 }],
    ['empty pixel format', { pixelFormat: '' }],
    ['null handle', { handle: null }],
    ['undefined handle', { handle: undefined }],
  ])('rejects %s', (_name, override) => {
    expect(validateFrame(makeFrame(override as object), null)).toBeNull();
  });

  it('rejects a timestamp older than the previous frame', () => {
    expect(validateFrame(makeFrame({ timestampMs: 900 }), 1000)).toBeNull();
  });

  it('accepts an equal timestamp (same-ms frames are not an error)', () => {
    expect(validateFrame(makeFrame({ timestampMs: 1000 }), 1000)).not.toBeNull();
  });

  it('rejects null/undefined input instead of throwing', () => {
    expect(validateFrame(null as never, null)).toBeNull();
    expect(validateFrame(undefined as never, null)).toBeNull();
  });
});
