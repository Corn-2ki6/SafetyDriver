// Run from mobile-app after Python run.py --image ... --jsonl outputs/portrait.jsonl
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { extractFeatures } from '../../src/features/vision/features.ts';
const path = process.argv[2] ?? 'python-prototype/vision/outputs/portrait.jsonl';
const rows = fs.readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);
let maxDifference=0;
for (const row of rows) {
  const result=extractFeatures(row.landmarks,row.width,row.height,row.poseMatrix);
  for (const key of ['earLeft','earRight','ear','mar','pitchDeg']) {
    if(row.features[key]===null) assert.equal(result[key],null);
    else {
      assert.equal(typeof result[key],'number');
      const delta=Math.abs(result[key]-row.features[key]);
      assert.ok(delta<1e-9,`${key}: ${delta}`);
      maxDifference=Math.max(maxDifference,delta);
    }
  }
  assert.deepEqual(result.issues,row.features.issues);
}
console.log(JSON.stringify({scope:'Python vs TypeScript on identical exported model outputs, not Android native inference',frames:rows.length,tolerance:1e-9,maxAbsoluteDifference:maxDifference,passed:true},null,2));
