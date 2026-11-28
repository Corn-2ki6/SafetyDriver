import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRegions, REGION_INDICES } from '../../src/features/vision/index.ts';
import { computeFaceMeasurements } from '../../src/features/vision/measurements.ts';
import { DrowsinessTracker } from '../../src/features/drowsiness/DrowsinessState.ts';
import { defaultSettings } from '../../src/types/index.ts';

function makeFrame(timestampMs, eyeOpening = 0.08, mouthOpening = 0.04) {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const setEye = (indices) => {
    const [cornerA, upperA, upperB, cornerB, lowerB, lowerA] = indices;
    points[cornerA] = { x: 0.3, y: 0.5, z: 0 };
    points[upperA] = { x: 0.4, y: 0.5 - eyeOpening / 2, z: 0 };
    points[upperB] = { x: 0.6, y: 0.5 - eyeOpening / 2, z: 0 };
    points[cornerB] = { x: 0.7, y: 0.5, z: 0 };
    points[lowerB] = { x: 0.6, y: 0.5 + eyeOpening / 2, z: 0 };
    points[lowerA] = { x: 0.4, y: 0.5 + eyeOpening / 2, z: 0 };
  };
  setEye(REGION_INDICES.leftEye);
  setEye(REGION_INDICES.rightEye);

  const [leftCorner, upperLip, rightCorner, lowerLip] = REGION_INDICES.mouth;
  points[leftCorner] = { x: 0.35, y: 0.7, z: 0 };
  points[upperLip] = { x: 0.5, y: 0.7 - mouthOpening / 2, z: 0 };
  points[rightCorner] = { x: 0.65, y: 0.7, z: 0 };
  points[lowerLip] = { x: 0.5, y: 0.7 + mouthOpening / 2, z: 0 };

  return {
    schemaVersion: 1,
    timestampMs,
    width: 640,
    height: 480,
    rotationApplied: 0,
    mirrored: false,
    inferenceMs: 8,
    ...extractRegions(points),
  };
}

test('EAR and MAR use image dimensions when scaling normalized landmarks', () => {
  const measurements = computeFaceMeasurements(makeFrame(0));
  assert.ok(measurements.ear !== null);
  assert.ok(Math.abs(measurements.ear - 0.15) < 0.001);
  assert.ok(measurements.mar !== null);
  assert.ok(Math.abs(measurements.mar - 0.1) < 0.001);
});

test('invalid and no-face results never produce measurements', () => {
  const noFace = {
    schemaVersion: 1,
    timestampMs: 0,
    width: 640,
    height: 480,
    rotationApplied: 0,
    mirrored: false,
    inferenceMs: 3,
    ...extractRegions([]),
  };
  assert.deepEqual(computeFaceMeasurements(noFace), { ear: null, mar: null });
});

test('closed-eye timing triggers only after continuous valid frames and resets on face loss', () => {
  const tracker = new DrowsinessTracker();
  let result;
  for (let timestampMs = 0; timestampMs <= 2000; timestampMs += 100) {
    result = tracker.update(makeFrame(timestampMs, 0.02), defaultSettings).result;
  }
  assert.equal(result.status, 'drowsy');

  const noFace = {
    schemaVersion: 1,
    timestampMs: 2100,
    width: 640,
    height: 480,
    rotationApplied: 0,
    mirrored: false,
    inferenceMs: 3,
    ...extractRegions([]),
  };
  tracker.update(noFace, defaultSettings);
  const returnedFace = tracker.update(makeFrame(2200, 0.02), defaultSettings);
  assert.equal(returnedFace.metrics.eyesClosedSec, 0);
  assert.equal(returnedFace.result.status, 'unknown');
});

test('a long frame gap resets eye-closure continuity', () => {
  const tracker = new DrowsinessTracker();
  tracker.update(makeFrame(0, 0.02), defaultSettings);
  const afterGap = tracker.update(makeFrame(1000, 0.02), defaultSettings);
  assert.equal(afterGap.metrics.eyesClosedSec, 0);
  assert.equal(afterGap.result.status, 'unknown');
});
