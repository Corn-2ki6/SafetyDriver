export type RandomForestNode = {
  feature: number;
  threshold: number;
  left: number;
  right: number;
  probabilities: number[];
};

export type RandomForestTree = {
  nodes: RandomForestNode[];
};

export type RandomForestModel = {
  version: 1;
  features: ['ear', 'mar', 'eyesClosedSec', 'yawnSec'];
  classes: ['awake', 'drowsy'];
  trees: RandomForestTree[];
};

export type RandomForestPrediction = {
  label: 'awake' | 'drowsy';
  confidence: number;
};

export const RANDOM_FOREST_CONFIDENCE_THRESHOLD = 0.6;

export function predictRandomForest(
  model: RandomForestModel,
  features: number[],
): RandomForestPrediction | null {
  if (model.trees.length === 0) return null;
  if (features.length !== model.features.length || !features.every(Number.isFinite)) {
    return null;
  }

  const votes = model.classes.map(() => 0);
  for (const tree of model.trees) {
    if (tree.nodes.length === 0) {
      throw new Error('Random Forest model contains an empty tree.');
    }
    let nodeIndex = 0;
    for (let steps = 0; steps < tree.nodes.length; steps += 1) {
      const node = tree.nodes[nodeIndex];
      if (!node) throw new Error('Random Forest model contains an invalid node reference.');

      if (node.feature < 0) {
        if (
          node.probabilities.length !== model.classes.length ||
          !node.probabilities.every((value) => Number.isFinite(value) && value >= 0)
        ) {
          throw new Error('Random Forest model contains invalid class probabilities.');
        }
        const total = node.probabilities.reduce((sum, value) => sum + value, 0);
        if (total <= 0) throw new Error('Random Forest leaf has no class probabilities.');
        node.probabilities.forEach((value, index) => {
          votes[index] += value / total;
        });
        break;
      }

      if (node.feature >= features.length) {
        throw new Error('Random Forest model refers to an unknown feature.');
      }
      nodeIndex = features[node.feature] <= node.threshold ? node.left : node.right;
      if (steps === tree.nodes.length - 1) {
        throw new Error('Random Forest tree contains a cycle or has no leaf.');
      }
    }
  }

  const totalVotes = votes.reduce((sum, value) => sum + value, 0);
  if (totalVotes === 0) return null;
  const bestIndex = votes.indexOf(Math.max(...votes));
  return {
    label: model.classes[bestIndex],
    confidence: votes[bestIndex] / totalVotes,
  };
}
