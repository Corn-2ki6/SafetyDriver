
import type { Metrics, Settings } from '../../types';

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
            reasons.push('EAR thấp: có dấu hiệu nhắm mắt');
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

    return {
        status: reasons.length > 0 ? 'drowsy' : 'awake',
        reasons,
    };
}
