import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRegions, parseVisionFrame, REGION_INDICES } from '../../src/features/vision/index.ts';

test('no face and malformed/missing data remain distinct', () => {
  assert.deepEqual(extractRegions([]), { status: 'NO_FACE', landmarks: [], regions: null });
  for (const points of [null, undefined, {}, [null], Array(478), Array(478).fill({ x: 0, y: NaN, z: 0 })]) {
    assert.deepEqual(extractRegions(points), { status: 'INVALID_LANDMARKS', landmarks: [], regions: null });
  }
});
test('groups preserve subject-side indices, input is copied, next loss clears results', () => {
  const points = Array.from({ length: 478 }, (_, i) => ({ x: i / 478, y: .5, z: -.1 }));
  const result = extractRegions(points);
  assert.equal(result.status, 'FACE_DETECTED');
  for (const [name, indices] of Object.entries(REGION_INDICES)) {
    assert.deepEqual(result.regions[name], indices.map(i => points[i]));
  }
  points[0].x = 99;
  assert.equal(result.landmarks[0].x, 0);
  assert.equal(extractRegions([]).regions, null);
});

test('vision frame parsing preserves no-face and rejects malformed face landmarks', () => {
  const metadata = {
    schemaVersion: 1,
    timestampMs: 42,
    width: 640,
    height: 480,
    rotationApplied: 90,
    mirrored: false,
    inferenceMs: 7,
  };

  assert.equal(parseVisionFrame({
    ...metadata,
    status: 'NO_FACE',
    landmarks: [],
  }).status, 'NO_FACE');
  assert.equal(parseVisionFrame({
    ...metadata,
    status: 'FACE_DETECTED',
    landmarks: [],
  }).status, 'INVALID_LANDMARKS');
  assert.equal(
    parseVisionFrame({ ...metadata, status: 'NO_FACE', landmarks: [{}] }).status,
    'INVALID_LANDMARKS',
  );
});
