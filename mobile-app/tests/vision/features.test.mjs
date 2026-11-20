import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractFeatures, pitchFromMatrix } from '../../src/features/vision/features.ts';
const cases = JSON.parse(fs.readFileSync(new URL('../../../docs/vision/examples/feature-cases.json', import.meta.url)));
const expand = c => {
  const p = Array.from({length:478},()=>({x:.5,y:.5,z:0}));
  for(const [i,[x,y]] of Object.entries(c.pixelPoints)) p[i]={x:x/c.width,y:y/c.height,z:0};
  return p;
};
test('shared hand-calculated open/closed mouth and signed pitch cases',()=>{
  for(const c of cases){
    const r=extractFeatures(expand(c),c.width,c.height,c.matrix);
    for(const [k,v] of Object.entries(c.expected)) assert.ok(Math.abs(r[k]-v)<1e-9,`${c.name} ${k}`);
    assert.deepEqual(r.issues,[]);
  }
});
test('missing, sparse, nonfinite data and invalid dimensions produce null',()=>{
  for(const p of [null,[],[{}],Array(478),Array(478).fill({x:.5,y:NaN,z:0})]){
    const r=extractFeatures(p,640,480);
    for(const k of ['earLeft','earRight','ear','mar','pitchDeg']) assert.equal(r[k],null);
  }
  for(const w of [0,-1,NaN,true,'640']) assert.deepEqual(extractFeatures([],w,480).issues,['INVALID_DIMENSIONS']);
});
test('zero eye baseline and missing pose remain partial, never fabricated',()=>{
  const p=expand(cases[0]); p[263]={...p[362]};
  const r=extractFeatures(p,640,480);
  assert.equal(r.earLeft,null); assert.equal(r.ear,null); assert.ok(r.earRight>0); assert.equal(r.pitchDeg,null);
  p[362].x=-1; assert.equal(extractFeatures(p,640,480).earLeft,null);
});
test('matrix rejects reflection, malformed, shear, nonuniform scale and gimbal lock',()=>{
  for(const m of [null,[],Array(4),[[0,0,1,0],[0,1,0,0],[-1,0,0,0],[0,0,0,1]],
    [[-1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
    [[2,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
    [[1,.2,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]]) assert.equal(pitchFromMatrix(m),null);
  assert.equal(pitchFromMatrix([[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]]),0);
});
