
import type { AlertEvent, AlertKind } from '../../types';

export type AlertRequest = {
    kind: AlertKind;
    detail: string;
    at?: Date;
};

export type AlertSysOptions = {
    cooldownMs?: number;
};

export class AlertSys {
    private events: AlertEvent[] = [];
    private lastTriggered = new Map<AlertKind, number>();
    private readonly cooldownMs: number;

    constructor(options: AlertSysOptions = {}) {
        this.cooldownMs = Math.max(0, options.cooldownMs ?? 3000);
    }

    /**
     * Creates an event unless the same alert kind is still in cooldown.
     * Returns null when the event is suppressed.
     */
    trigger(request: AlertRequest): AlertEvent | null {
        const at = request.at ?? new Date();
        const timestamp = at.getTime();

        if (!Number.isFinite(timestamp) || !request.detail.trim()) {
            return null;
        }

        const lastTime = this.lastTriggered.get(request.kind);

        if (
            lastTime !== undefined &&
            timestamp >= lastTime &&
            timestamp - lastTime < this.cooldownMs
        ) {
            return null;
        }

        const event: AlertEvent = {
            id: `${request.kind}-${timestamp}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            kind: request.kind,
            detail: request.detail.trim(),
            at,
        };

        this.lastTriggered.set(request.kind, timestamp);
        this.events = [...this.events, event];

        return event;
    }

    getEvents(): AlertEvent[] {
        return [...this.events];
    }

    clearEvents(): void {
        this.events = [];
    }

    resetCooldowns(): void {
        this.lastTriggered.clear();
    }
}
