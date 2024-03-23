import { describe, test, beforeEach, expect } from "vitest";
import { AsyncOp } from "~/types/asyncOp/asyncOp";
import type { AsyncOpStats } from "~/types/asyncOp/asyncOpStats";
import { Timestamp, Duration } from "~/types/common/duration";

describe("AsyncOp", () => {
    let asyncOp: AsyncOp;
    let stats: AsyncOpStats;
    let timestamp: Timestamp;

    beforeEach(() => {
        stats = {
            createdAt: new Timestamp(1000n, 0),
            total: new Duration(1000n, 0),
            busy: new Duration(500n, 0),
            idle: new Duration(500n, 0),
            lastPollStarted: new Timestamp(1500n, 0),
            lastPollEnded: undefined,
            polls: 1n,
            taskIdStr: "task",
            attributes: [],
        };
        timestamp = new Timestamp(2000n, 0);
        asyncOp = new AsyncOp(1n, "parent", 1n, 1n, "source", stats);
    });

    test("totalDuration", () => {
        const duration = asyncOp.totalDuration(timestamp);
        expect(duration.seconds).toBe(1000n);
        expect(duration.nanos).toBe(0);
    });

    test("busyDuration", () => {
        const duration = asyncOp.busyDuration(timestamp);
        expect(duration.seconds).toBe(1000n);
        expect(duration.nanos).toBe(0);
    });

    test("idleDuration", () => {
        const duration = asyncOp.idleDuration(timestamp);
        expect(duration.seconds).toBe(500n);
        expect(duration.nanos).toBe(0);
    });

    test("isDropped", () => {
        const isDropped = asyncOp.isDropped();
        expect(isDropped).toBe(true);
    });
});
