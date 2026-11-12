/** CV-03 handoff. Detection geometry only; not identity or fatigue recognition. */
export type Rotation = 0 | 90 | 180 | 270;
export interface Landmark { x: number; y: number; z: number }
export const REGION_INDICES = {
  leftEye: [362, 385, 387, 263, 373, 380],
  rightEye: [33, 160, 158, 133, 153, 144],
  mouth: [61, 13, 291, 14],
  headPoseAnchors: [1, 152, 33, 263, 61, 291],
} as const;
export type Regions = Record<keyof typeof REGION_INDICES, Landmark[]>;
export interface VisionFrame {
  schemaVersion: 1;
  /** Same source clock as Camera FrameInput; never replace with Date.now(). */
  timestampMs: number;
  /** Upright output dimensions, after rotation. */
  width: number;
  height: number;
  rotationApplied: Rotation;
  mirrored: false;
  /** Processing time, not camera FPS or an accuracy score. */
  inferenceMs: number;
}
export type FaceLandmarks = VisionFrame & (
  | { status: 'FACE_DETECTED'; landmarks: Landmark[]; regions: Regions }
  | { status: 'NO_FACE' | 'INVALID_LANDMARKS'; landmarks: []; regions: null }
);

/** Validate native coordinates before any EAR/MAR/head-pose consumer uses them.
 * Empty array means no face. Missing/malformed data means invalid, never no face.
 * Coordinates may extend outside the image; do not clamp or invent values.
 */
export function extractRegions(points: unknown):
  Pick<FaceLandmarks, 'status' | 'landmarks' | 'regions'> {
  if (Array.isArray(points) && points.length === 0) {
    return { status: 'NO_FACE', landmarks: [], regions: null };
  }
  if (!Array.isArray(points) || points.length !== 478 || !Array.from(points).every(
    p => p !== null && typeof p === 'object' &&
      [p.x, p.y, p.z].every(v => typeof v === 'number' && Number.isFinite(v)),
  )) {
    return { status: 'INVALID_LANDMARKS', landmarks: [], regions: null };
  }
  const landmarks: Landmark[] = points.map(p => ({ x: p.x, y: p.y, z: p.z }));
  const regions = Object.fromEntries(Object.entries(REGION_INDICES).map(
    ([name, indices]) => [name, indices.map(index => landmarks[index])],
  )) as Regions;
  return { status: 'FACE_DETECTED', landmarks, regions };
}
