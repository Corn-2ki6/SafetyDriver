import type { RandomForestModel } from './randomForest';

export const randomForestModel: RandomForestModel = {
  version: 1,
  features: ['ear', 'mar', 'eyesClosedSec', 'yawnSec'],
  classes: ['awake', 'drowsy'],
  trees: [],
};
