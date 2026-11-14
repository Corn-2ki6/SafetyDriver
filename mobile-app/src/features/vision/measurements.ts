import type { FaceLandmarks, Landmark } from './index';

export type FaceMeasurements = {
  ear: number | null;
  mar: number | null;
};

function distance(a: Landmark, b: Landmark, width: number, height: number): number {
  return Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
}

function eyeAspectRatio(points: Landmark[], width: number, height: number): number | null {
  if (points.length !== 6) return null;

  const horizontal = distance(points[0], points[3], width, height);
  if (horizontal === 0) return null;

  const verticalOne = distance(points[1], points[5], width, height);
  const verticalTwo = distance(points[2], points[4], width, height);
  const ear = (verticalOne + verticalTwo) / (2 * horizontal);
  return Number.isFinite(ear) ? ear : null;
}

export function computeFaceMeasurements(frame: FaceLandmarks): FaceMeasurements {
  if (
    frame.status !== 'FACE_DETECTED' ||
    !Number.isFinite(frame.width) ||
    !Number.isFinite(frame.height) ||
    frame.width <= 0 ||
    frame.height <= 0
  ) {
    return { ear: null, mar: null };
  }

  const { leftEye, rightEye, mouth } = frame.regions;
  const leftEar = eyeAspectRatio(leftEye, frame.width, frame.height);
  const rightEar = eyeAspectRatio(rightEye, frame.width, frame.height);
  const mouthWidth = distance(mouth[0], mouth[2], frame.width, frame.height);
  const mouthHeight = distance(mouth[1], mouth[3], frame.width, frame.height);

  return {
    ear: leftEar !== null && rightEar !== null ? (leftEar + rightEar) / 2 : null,
    mar: mouthWidth > 0 && Number.isFinite(mouthHeight / mouthWidth)
      ? mouthHeight / mouthWidth
      : null,
  };
}
