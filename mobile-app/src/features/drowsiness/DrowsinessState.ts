
import type { AlertKind, Metrics, Settings } from '../../types';
import type { FaceLandmarks } from '../vision/index.ts';
import { extractFeatures } from '../vision/features.ts';

export type DrowsinessStatus =
    | 'awake'
    | 'drowsy'
    | 'noFace'
    | 'unknown';

export type DrowsinessInput = {
    faceFound: boolean;
    metrics: Metrics;
    settings: Settings;
    /** True only after a calibrated downward pitch persists long enough. */
    headNodDetected?: boolean;
};

export type DrowsinessResult = {
    status: DrowsinessStatus;
    reasons: string[];
    alertKind?: AlertKind;
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
    let prolongedClosure = false;

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
            prolongedClosure = true;
            reasons.push('Thời gian nhắm mắt đạt ngưỡng');
        }
    }

    if (metrics.pitchDeg !== null && Number.isFinite(metrics.pitchDeg)) {
        hasValidMeasurement = true;
        if (input.headNodDetected === true) {
            reasons.push('Cúi đầu kéo dài: nghi ngờ gục đầu');
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
        alertKind: reasons.length === 0 ? undefined
            : prolongedClosure ? 'eyesClosed'
            : input.headNodDetected ? 'headNod'
            : 'yawn',
    };
}

export type DrowsinessFrameResult = {
    metrics: Metrics;
    result: DrowsinessResult;
};

const MAX_CONTIGUOUS_FRAME_GAP_MS = 500;
// Provisional head-nod rules: measure movement relative to a neutral
// baseline, not absolute model pitch. Verify the sign on a real Android phone.
const NEUTRAL_CALIBRATION_MS = 800;
const HEAD_DOWN_DELTA_DEG = 18;
const HEAD_DOWN_DURATION_MS = 800;

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
    private neutralSinceMs: number | null = null;
    private neutralPitchSum = 0;
    private neutralSampleCount = 0;
    private neutralPitchDeg: number | null = null;
    private headDownSinceMs: number | null = null;

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
            this.resetHeadPose();
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
            this.resetHeadPose();
            return this.unknownResult();
        }

        const { ear, mar, pitchDeg } = extractFeatures(
            frame.landmarks, frame.width, frame.height, frame.poseMatrix ?? null,
        );

        // No pose => display missing and reset the nod timer; keep valid EAR/MAR.
        // The neutral calibration assumes the driver looks forward at session start.
        let headNodDetected = false;
        if (pitchDeg === null) {
            this.resetHeadPose();
        } else if (this.neutralPitchDeg === null) {
            this.neutralSinceMs ??= timestampMs;
            this.neutralPitchSum += pitchDeg;
            this.neutralSampleCount += 1;
            if (
                timestampMs - this.neutralSinceMs >= NEUTRAL_CALIBRATION_MS &&
                this.neutralSampleCount >= 4
            ) {
                this.neutralPitchDeg = this.neutralPitchSum / this.neutralSampleCount;
            }
        } else {
            // Negative Rx deviation is treated as downward for this model
            // convention. Confirm experimentally and flip sign if required.
            const downwardDelta = this.neutralPitchDeg - pitchDeg;
            if (downwardDelta >= HEAD_DOWN_DELTA_DEG) {
                this.headDownSinceMs ??= timestampMs;
                headNodDetected =
                    timestampMs - this.headDownSinceMs >= HEAD_DOWN_DURATION_MS;
            } else {
                this.headDownSinceMs = null;
            }
        }
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
            pitchDeg,
            fps: gapMs > 0 ? 1000 / gapMs : null,
            eyesClosedSec,
            eyesOpenSec,
            noFaceSec: null,
        };
        return {
            metrics,
            result: evaluateDrowsiness({ faceFound: true, metrics, settings, headNodDetected }),
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
        this.resetHeadPose();
    }

    private resetHeadPose(): void {
        this.neutralSinceMs = null;
        this.neutralPitchSum = 0;
        this.neutralSampleCount = 0;
        this.neutralPitchDeg = null;
        this.headDownSinceMs = null;
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
