import { describe, test, beforeEach, expect } from "vitest";
import {
    TokioTask,
    TaskState,
    type FormattedField,
} from "~/types/task/tokioTask";
import { type TokioTaskStats } from "~/types/task/tokioTaskStats";
import { Duration, Timestamp } from "~/types/common/duration";

describe("TokioTask", () => {
    let task: TokioTask;
    let formattedFields: Array<FormattedField>;
    let stats: TokioTaskStats;
    let timestamp: Timestamp;

    beforeEach(() => {
        formattedFields = [{ name: "target", value: "tokio:task" }];
        stats = {
            polls: 100n,
            createdAt: new Timestamp(0n, 0),
            busy: new Duration(500n, 0),
            scheduled: new Duration(300n, 0),
            lastPollStarted: new Timestamp(1000n, 0),
            lastPollEnded: new Timestamp(0n, 0),
            idle: new Duration(200n, 0),
            wakes: 1n,
            wakerClones: 1n,
            wakerDrops: 1n,
            selfWakes: 1n,
            lastWake: new Timestamp(1000n, 0),
        };
        timestamp = new Timestamp(1000n, 0);
        task = new TokioTask(
            1n,
            1n,
            1n,
            "some task",
            formattedFields,
            stats,
            "tokio:task",
            "task1",
            "app.rs/68:10",
            "task",
        );
    });

    test("totalDuration", () => {
        const duration = task.totalDuration(timestamp);
        expect(duration.nanos).toBe(0);
        expect(duration.seconds).toBe(1000n);
    });

    test("busyDuration", () => {
        const duration = task.busyDuration(timestamp);
        expect(duration.nanos).toBe(0);
        expect(duration.seconds).toBe(500n);
    });

    test("scheduledDuration", () => {
        const duration = task.scheduledDuration(timestamp);
        expect(duration.nanos).toBe(0);
        expect(duration.seconds).toBe(300n);
    });

    test("idleDuration", () => {
        const duration = task.idleDuration(timestamp);
        expect(duration.nanos).toBe(0);
        expect(duration.seconds).toBe(200n);
    });

    test("isRunning", () => {
        const isRunning = task.isRunning();
        expect(isRunning).toBe(true);
    });

    test("isScheduled", () => {
        const isScheduled = task.isScheduled();
        expect(isScheduled).toBe(false);
    });

    test("isCompleted", () => {
        const isCompleted = task.isCompleted();
        expect(isCompleted).toBe(false);
    });

    test("state", () => {
        const state = task.state();
        expect(state).toBe(TaskState.Running);
    });
});
