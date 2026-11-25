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

test('pose matrix survives native-to-vision parsing without being fabricated', () => {
  const frame = {
    schemaVersion: 1,
    timestampMs: 100,
    width: 640,
    height: 480,
    rotationApplied: 0,
    mirrored: false,
    inferenceMs: 10,
    status: 'FACE_DETECTED',
    landmarks: Array.from({ length: 478 }, () => ({ x: .5, y: .5, z: 0 })),
    poseMatrix: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
  };
  const parsed = parseVisionFrame(frame);
  assert.equal(parsed.status, 'FACE_DETECTED');
  assert.deepEqual(parsed.poseMatrix, frame.poseMatrix);
  assert.notEqual(parsed.poseMatrix, frame.poseMatrix);
  frame.poseMatrix[1][1] = 99;
  assert.equal(parsed.poseMatrix[1][1], 1);

  const invalid = parseVisionFrame({ ...frame, poseMatrix: [[1]], status: 'NO_FACE', landmarks: [] });
  assert.equal(invalid.status, 'NO_FACE');
  assert.equal(invalid.poseMatrix, null);
});
