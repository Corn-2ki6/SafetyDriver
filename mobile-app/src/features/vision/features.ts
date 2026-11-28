import { REGION_INDICES } from './index.ts';
export interface FeatureVector {
  earLeft: number | null;
  earRight: number | null;
  ear: number | null;
  mar: number | null;
  /** Model-relative Rx angle; degrees, R=Rz*Ry*Rx. Not vehicle-calibrated pitch. */
  pitchDeg: number | null;
  issues: string[];
}
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Matrix must be a nested row-major 4x4, not a flat Android column-major buffer. */
export function pitchFromMatrix(matrix: unknown): number | null {
  if (!Array.isArray(matrix) || matrix.length !== 4 || !Array.from(matrix).every(
    row => Array.isArray(row) && row.length === 4 && Array.from(row).every(finite),
  )) return null;
  const m = matrix as number[][];
  if (m[3].some((v, i) => Math.abs(v - (i === 3 ? 1 : 0)) > 1e-6)) return null;
  const scales = [0, 1, 2].map(j => Math.hypot(m[0][j], m[1][j], m[2][j]));
  if (Math.min(...scales) < 1e-8 || Math.max(...scales) / Math.min(...scales) > 1.001) return null;
  const r = m.slice(0, 3).map(row => row.slice(0, 3).map((v, j) => v / scales[j]));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    if (Math.abs(r.reduce((s, row) => s + row[i] * row[j], 0) - (i === j ? 1 : 0)) > 1e-3) return null;
  }
  const det = r[0][0] * (r[1][1] * r[2][2] - r[1][2] * r[2][1])
    - r[0][1] * (r[1][0] * r[2][2] - r[1][2] * r[2][0])
    + r[0][2] * (r[1][0] * r[2][1] - r[1][1] * r[2][0]);
  if (Math.abs(det - 1) > 1e-3 || Math.hypot(r[0][0], r[1][0]) < 1e-6) return null;
  return Math.atan2(r[2][1], r[2][2]) * 180 / Math.PI;
}

export function extractFeatures(points: unknown, width: number, height: number, matrix: unknown = null): FeatureVector {
  const out: FeatureVector = { earLeft: null, earRight: null, ear: null, mar: null, pitchDeg: null, issues: [] };
  if (!finite(width) || !finite(height) || width <= 0 || height <= 0) {
    out.issues.push('INVALID_DIMENSIONS'); return out;
  }
  if (Array.isArray(points) && points.length === 0) { out.issues.push('NO_FACE'); return out; }
  if (!Array.isArray(points) || points.length !== 478 || !Array.from(points).every(
    p => p !== null && typeof p === 'object' && [p.x, p.y, p.z].every(finite),
  )) { out.issues.push('INVALID_LANDMARKS'); return out; }
  const group = (indices: readonly number[]): number[][] | null => {
    const selected = indices.map(i => points[i]);
    if (selected.some(p => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) return null;
    return selected.map(p => [p.x * width, p.y * height]);
  };
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (const [name, indices] of [['earLeft', REGION_INDICES.leftEye], ['earRight', REGION_INDICES.rightEye]] as const) {
    const p = group(indices);
    if (p) {
      const denominator = 2 * dist(p[0], p[3]);
      if (denominator > 1e-6) {
        const value = (dist(p[1], p[5]) + dist(p[2], p[4])) / denominator;
        if (finite(value)) out[name] = value;
      }
    }
    if (out[name] === null) out.issues.push(`INVALID_${name.toUpperCase()}`);
  }
  if (out.earLeft !== null && out.earRight !== null) out.ear = (out.earLeft + out.earRight) / 2;
  const mouth = group(REGION_INDICES.mouth);
  if (mouth) {
    const denominator = dist(mouth[0], mouth[2]);
    if (denominator > 1e-6) {
      const value = dist(mouth[1], mouth[3]) / denominator;
      if (finite(value)) out.mar = value;
    }
  }
  if (out.mar === null) out.issues.push('INVALID_MOUTH');
  if (group(REGION_INDICES.headPoseAnchors)) out.pitchDeg = pitchFromMatrix(matrix);
  if (out.pitchDeg === null) out.issues.push('POSE_UNAVAILABLE');
  return out;
}
