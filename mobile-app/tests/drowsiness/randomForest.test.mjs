import test from 'node:test';
import assert from 'node:assert/strict';
import { predictRandomForest } from '../../src/features/drowsiness/randomForest.ts';

const model = {
  version: 1,
  features: ['ear', 'mar', 'eyesClosedSec', 'yawnSec'],
  classes: ['awake', 'drowsy'],
  trees: [
    {
      nodes: [
        { feature: 0, threshold: 0.2, left: 1, right: 2, probabilities: [0.5, 0.5] },
        { feature: -2, threshold: -2, left: -1, right: -1, probabilities: [1, 0] },
        { feature: -2, threshold: -2, left: -1, right: -1, probabilities: [0, 1] },
      ],
    },
    {
      nodes: [
        { feature: -2, threshold: -2, left: -1, right: -1, probabilities: [1, 0] },
      ],
    },
  ],
};

test('Random Forest averages tree probabilities and traverses feature splits', () => {
  assert.deepEqual(
    predictRandomForest(model, [0.1, 0.1, 0, 0]),
    { label: 'awake', confidence: 1 },
  );
  assert.deepEqual(
    predictRandomForest(model, [0.3, 0.1, 1, 0]),
    { label: 'awake', confidence: 0.5 },
  );
});

test('missing features or an untrained model produce no ML prediction', () => {
  assert.equal(predictRandomForest(model, [0.2, 0.1]), null);
  assert.equal(predictRandomForest({ ...model, trees: [] }, [0.2, 0.1, 0, 0]), null);
});
