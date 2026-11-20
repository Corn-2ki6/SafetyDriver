
import type { Metrics, Settings } from '../../types';
import type { FaceLandmarks } from '../vision/index.ts';
import { computeFaceMeasurements } from '../vision/measurements.ts';

export type DrowsinessStatus =
    | 'awake'
    | 'drowsy'
    | 'noFace'
    | 'unknown';

export type DrowsinessInput = {
    faceFound: boolean;
    metrics: Metrics;
    settings: Settings;
};

export type DrowsinessResult = {
    status: DrowsinessStatus;
    reasons: string[];
};

/**
 * TV4 - DrowsinessState
 * Evaluates available measurements.
 *
 * This is a preliminary rule-based implementation.
 * It is not a validated driver-safety model.
 */
export function evaluateDrowsiness(
    input: DrowsinessInput,
): DrowsinessResult {
    const { faceFound, metrics, settings } = input;

    if (!faceFound) {
        return {
            status: 'noFace',
            reasons: ['Không phát hiện khuôn mặt'],
        };
    }

    const reasons: string[] = [];
    let hasValidMeasurement = false;
    let eyeClosurePending = false;

    const ear = metrics.ear;
    const mar = metrics.mar;
    const eyesClosedSec = metrics.eyesClosedSec;

    // Validate thresholds before using them.
    const validEarThreshold =
        Number.isFinite(settings.earThreshold) &&
        settings.earThreshold > 0;

    const validMarThreshold =
        Number.isFinite(settings.marThreshold) &&
        settings.marThreshold > 0;

    const validClosedDuration =
        Number.isFinite(settings.eyesClosedSec) &&
        settings.eyesClosedSec > 0;

    if (
        ear !== null &&
        Number.isFinite(ear) &&
        validEarThreshold
    ) {
        hasValidMeasurement = true;

        if (ear < settings.earThreshold) {
            eyeClosurePending = true;
        }
    }

    if (
        mar !== null &&
        Number.isFinite(mar) &&
        validMarThreshold
    ) {
        hasValidMeasurement = true;

        if (mar >= settings.marThreshold) {
            reasons.push('MAR cao: có dấu hiệu ngáp');
        }
    }

    if (
        eyesClosedSec !== null &&
        Number.isFinite(eyesClosedSec) &&
        eyesClosedSec >= 0 &&
        validClosedDuration
    ) {
        hasValidMeasurement = true;

        if (eyesClosedSec >= settings.eyesClosedSec) {
            reasons.push('Thời gian nhắm mắt đạt ngưỡng');
        }
    }

    if (!hasValidMeasurement) {
        return {
            status: 'unknown',
            reasons: ['Không đủ dữ liệu hợp lệ để đánh giá'],
        };
    }

    if (eyeClosurePending && reasons.length === 0) {
        return {
            status: 'unknown',
            reasons: ['Đang theo dõi thời gian nhắm mắt liên tục'],
        };
    }

    return {
        status: reasons.length > 0 ? 'drowsy' : 'awake',
        reasons,
    };
}

export type DrowsinessFrameResult = {
    metrics: Metrics;
    result: DrowsinessResult;
};

const MAX_CONTIGUOUS_FRAME_GAP_MS = 500;

function emptyMetrics(noFaceSec: number | null = null): Metrics {
    return {
        ear: null,
        mar: null,
        pitchDeg: null,
        fps: null,
        eyesClosedSec: null,
        eyesOpenSec: null,
        noFaceSec,
    };
}

export class DrowsinessTracker {
    private previousTimestampMs: number | null = null;
    private closedSinceMs: number | null = null;
    private openSinceMs: number | null = null;
    private noFaceSinceMs: number | null = null;

    update(frame: FaceLandmarks, settings: Settings): DrowsinessFrameResult {
        const timestampMs = frame.timestampMs;
        if (!Number.isFinite(timestampMs) || timestampMs < 0) {
            this.reset();
            return this.unknownResult();
        }

        const previousTimestampMs = this.previousTimestampMs;
        const firstFrame = previousTimestampMs === null;
        const gapMs = firstFrame ? 0 : timestampMs - previousTimestampMs;
        if (!firstFrame && gapMs <= 0) {
            this.reset();
            return this.unknownResult();
        }
        if (gapMs > MAX_CONTIGUOUS_FRAME_GAP_MS) {
            this.resetIntervals();
        }
        this.previousTimestampMs = timestampMs;

        if (frame.status === 'NO_FACE') {
            this.closedSinceMs = null;
            this.openSinceMs = null;
            this.noFaceSinceMs ??= timestampMs;
            const metrics = emptyMetrics((timestampMs - this.noFaceSinceMs) / 1000);
            return {
                metrics,
                result: evaluateDrowsiness({ faceFound: false, metrics, settings }),
            };
        }

        this.noFaceSinceMs = null;
        if (frame.status !== 'FACE_DETECTED') {
            this.closedSinceMs = null;
            this.openSinceMs = null;
            return this.unknownResult();
        }

        const { ear, mar } = computeFaceMeasurements(frame);
        let eyesClosedSec: number | null = null;
        let eyesOpenSec: number | null = null;

        if (ear !== null && Number.isFinite(settings.earThreshold) && settings.earThreshold > 0) {
            if (ear < settings.earThreshold) {
                this.closedSinceMs ??= timestampMs;
                this.openSinceMs = null;
                eyesClosedSec = (timestampMs - this.closedSinceMs) / 1000;
            } else {
                this.openSinceMs ??= timestampMs;
                this.closedSinceMs = null;
                eyesOpenSec = (timestampMs - this.openSinceMs) / 1000;
            }
        } else {
            this.closedSinceMs = null;
            this.openSinceMs = null;
        }

        const metrics: Metrics = {
            ear,
            mar,
            pitchDeg: null,
            fps: gapMs > 0 ? 1000 / gapMs : null,
            eyesClosedSec,
            eyesOpenSec,
            noFaceSec: null,
        };
        return {
            metrics,
            result: evaluateDrowsiness({ faceFound: true, metrics, settings }),
        };
    }

    reset(): void {
        this.previousTimestampMs = null;
        this.resetIntervals();
    }

    private resetIntervals(): void {
        this.closedSinceMs = null;
        this.openSinceMs = null;
        this.noFaceSinceMs = null;
    }

    private unknownResult(): DrowsinessFrameResult {
        const metrics = emptyMetrics();
        return {
            metrics,
            result: {
                status: 'unknown',
                reasons: ['Không đủ dữ liệu hợp lệ để đánh giá'],
            },
        };
    }
}
