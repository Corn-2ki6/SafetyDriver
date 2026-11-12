
const assert = require('node:assert/strict');

const {
  evaluateDrowsiness,
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

console.log('\nAll 7 TV4 tests passed.');
