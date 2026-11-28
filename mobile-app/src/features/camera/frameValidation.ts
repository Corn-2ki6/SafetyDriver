import type { FrameInput, FrameOrientation, RawFrame } from '../../types/camera';

const ORIENTATIONS: readonly number[] = [0, 90, 180, 270];

/**
 * Returns a validated FrameInput, or null if the frame must be dropped.
 * Invalid frames are never "repaired" with default values.
 */
export function validateFrame(
  frame: RawFrame,
  lastTimestampMs: number | null,
): FrameInput | null {
  if (!frame) return null;
  const { timestampMs, width, height, orientation, pixelFormat, handle } = frame;

  if (!Number.isFinite(timestampMs) || timestampMs < 0) return null;
  if (lastTimestampMs !== null && timestampMs < lastTimestampMs) return null;
  if (!Number.isInteger(width) || width <= 0) return null;
  if (!Number.isInteger(height) || height <= 0) return null;
  if (!ORIENTATIONS.includes(orientation)) return null;
  if (typeof pixelFormat !== 'string' || pixelFormat.length === 0) return null;
  if (handle === null || handle === undefined) return null;

  return {
    timestampMs,
    width,
    height,
    orientation: orientation as FrameOrientation,
    pixelFormat,
    handle,
  };
}
