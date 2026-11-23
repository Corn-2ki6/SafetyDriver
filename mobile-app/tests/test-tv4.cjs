
const assert = require('node:assert/strict');

const {
  evaluateDrowsiness,
  DrowsinessTracker,
} = require('../.test-build/features/drowsiness/DrowsinessState.js');

const {
  AlertSys,
} = require('../.test-build/features/alerts/AlertSys.js');

const { defaultSettings } = require('../.test-build/types/index.js');

const normalMetrics = {
  ear: 0.31,
  mar: 0.18,
  pitchDeg: 4,
  fps: 24,
  eyesClosedSec: 0.2,
  eyesOpenSec: 1.2,
  noFaceSec: 0,
};

function test(name, callback) {
  try {
    callback();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

// Test 1: Normal measurements
test('Normal measurements return awake', () => {
  const result = evaluateDrowsiness({
    faceFound: true,
    metrics: normalMetrics,
    settings: defaultSettings,
  });

  assert.equal(result.status, 'awake');
});

// Test 2: Eyes closed for too long
test('Long eye closure returns drowsy', () => {
  const result = evaluateDrowsiness({
    faceFound: true,
    metrics: { ...normalMetrics, eyesClosedSec: 2.5 },
    settings: defaultSettings,
  });

  assert.equal(result.status, 'drowsy');
});

// Test 3: High MAR
test('MAR above threshold returns drowsy', () => {
  const result = evaluateDrowsiness({
    faceFound: true,
    metrics: { ...normalMetrics, mar: 0.7 },
    settings: defaultSettings,
  });

  assert.equal(result.status, 'drowsy');
});

// Test 4: Face not found
test('Missing face returns noFace', () => {
  const result = evaluateDrowsiness({
    faceFound: false,
    metrics: normalMetrics,
    settings: defaultSettings,
  });

  assert.equal(result.status, 'noFace');
});

// Test 5: All relevant measurements missing
test('Missing measurements return unknown', () => {
  const result = evaluateDrowsiness({
    faceFound: true,
    metrics: {
      ...normalMetrics,
      ear: null,
      mar: null,
      eyesClosedSec: null,
    },
    settings: defaultSettings,
  });

  assert.equal(result.status, 'unknown');
});

// Test 6: Duplicate alerts during cooldown
test('Duplicate alert is suppressed during cooldown', () => {
  const alerts = new AlertSys({ cooldownMs: 3000 });

  const first = alerts.trigger({
    kind: 'eyesClosed',
    detail: 'Eyes closed too long',
    at: new Date(10000),
  });

  const second = alerts.trigger({
    kind: 'eyesClosed',
    detail: 'Eyes closed too long',
    at: new Date(12000),
  });

  assert.notEqual(first, null);
  assert.equal(second, null);
  assert.equal(alerts.getEvents().length, 1);
});

// Test 7: Alert accepted after cooldown
test('Alert is accepted after cooldown', () => {
  const alerts = new AlertSys({ cooldownMs: 3000 });

  alerts.trigger({
    kind: 'eyesClosed',
    detail: 'First alert',
    at: new Date(10000),
  });

  const second = alerts.trigger({
    kind: 'eyesClosed',
    detail: 'Second alert',
    at: new Date(13000),
  });

  assert.notEqual(second, null);
  assert.equal(alerts.getEvents().length, 2);
});



// Synthetic geometric landmarks and pose matrices: these test the code path,
// not detection accuracy on real drivers or the physical pitch direction.
function createFrame(timestampMs, pitchDeg = 0, status = 'FACE_DETECTED') {
  if (status === 'NO_FACE') {
    return {
      schemaVersion: 1, timestampMs, width: 640, height: 480,
      rotationApplied: 0, mirrored: false, inferenceMs: 1,
      status, landmarks: [], regions: null, poseMatrix: null,
    };
  }
  const pts = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const point = (id, x, y) => { pts[id] = { x: x / 640, y: y / 480, z: 0 }; };
  for (const [ids, left] of [
    [[362, 385, 387, 263, 373, 380], 300],
    [[33, 160, 158, 133, 153, 144], 100],
  ]) {
    [[0, 150], [10, 144], [30, 144], [40, 150], [30, 156], [10, 156]]
      .forEach(([dx, y], i) => point(ids[i], left + dx, y));
  }
  [[61, 200, 300], [13, 250, 290], [291, 300, 300], [14, 250, 310]]
    .forEach(([id, x, y]) => point(id, x, y));
  const a = pitchDeg * Math.PI / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  return {
    schemaVersion: 1, timestampMs, width: 640, height: 480,
    rotationApplied: 0, mirrored: false, inferenceMs: 1,
    status, landmarks: pts, regions: null,
    poseMatrix: [[1, 0, 0, 0], [0, cos, -sin, 0], [0, sin, cos, 0], [0, 0, 0, 1]],
  };
}

function calibrate(tracker) {
  let last;
  for (const t of [0, 200, 400, 600, 800]) {
    last = tracker.update(createFrame(t, 0), defaultSettings);
  }
  return last;
}

test('Head pose is shown as measured pitch; neutral frames do not alert', () => {
  const tracker = new DrowsinessTracker();
  const output = calibrate(tracker);
  assert.equal(output.metrics.pitchDeg, 0);
  assert.equal(output.result.status, 'awake');
  assert.equal(output.result.alertKind, undefined);
});

test('Sustained negative pitch deviation after calibration yields headNod', () => {
  const tracker = new DrowsinessTracker();
  calibrate(tracker);
  let result;
  for (const t of [1000, 1200, 1400, 1600, 1800]) {
    result = tracker.update(createFrame(t, -25), defaultSettings);
  }
  assert.ok(Math.abs(result.metrics.pitchDeg + 25) < 1e-9);
  assert.equal(result.result.status, 'drowsy');
  assert.equal(result.result.alertKind, 'headNod');
  assert.ok(result.result.reasons.some(r => r.includes('gục đầu')));
});

test('Upward pitch and short downward movements do not generate headNod', () => {
  const up = new DrowsinessTracker();
  calibrate(up);
  for (const t of [1000, 1200, 1400, 1600, 1800]) {
    const o = up.update(createFrame(t, 25), defaultSettings);
    assert.notEqual(o.result.alertKind, 'headNod');
  }
  const short = new DrowsinessTracker();
  calibrate(short);
  for (const t of [1000, 1200, 1400]) {
    assert.notEqual(short.update(createFrame(t, -25), defaultSettings).result.alertKind, 'headNod');
  }
  assert.notEqual(short.update(createFrame(1600, 0), defaultSettings).result.alertKind, 'headNod');
});

test('Missing pose clears pitch and prevents stale head-nod alerts', () => {
  const tracker = new DrowsinessTracker();
  calibrate(tracker);
  const frame = createFrame(1000, -25);
  frame.poseMatrix = null;
  const output = tracker.update(frame, defaultSettings);
  assert.equal(output.metrics.pitchDeg, null);
  assert.equal(output.result.status, 'awake');
});

test('No-face and a long frame gap reset head pose calibration', () => {
  const tracker = new DrowsinessTracker();
  calibrate(tracker);
  assert.equal(tracker.update(createFrame(1000, 0, 'NO_FACE'), defaultSettings).result.status, 'noFace');
  assert.notEqual(tracker.update(createFrame(1200, -30), defaultSettings).result.alertKind, 'headNod');
  const gap = new DrowsinessTracker();
  calibrate(gap);
  assert.notEqual(gap.update(createFrame(2000, -30), defaultSettings).result.alertKind, 'headNod');
});

test('Drowsiness kind prioritizes prolonged eye closure over nod and yawn', () => {
  const result = evaluateDrowsiness({
    faceFound: true,
    metrics: { ...normalMetrics, eyesClosedSec: 3, mar: 0.8, pitchDeg: -25 },
    settings: defaultSettings,
    headNodDetected: true,
  });
  assert.equal(result.alertKind, 'eyesClosed');
});

console.log('\nAll TV4 + pitch tests passed.');
