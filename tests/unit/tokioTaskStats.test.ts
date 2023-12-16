import { Duration, Timestamp } from "@bufbuild/protobuf";
import { fromProtoTaskStats } from "../../composables/task/tokioTaskStats";
import { PollStats } from "../../gen/common_pb";
import { Stats } from "../../gen/tasks_pb";

describe("TokioTaskStats", () => {
    test("fromProtoTaskStats", () => {
        const taskStats = fromProtoTaskStats(
            new Stats({
                createdAt: new Timestamp({
                    seconds: 0n,
                    nanos: 0,
                }),
                droppedAt: new Timestamp({
                    seconds: 1000n,
                    nanos: 0,
                }),
                pollStats: new PollStats({
                    polls: 100n,
                    busyTime: new Duration({
                        seconds: 500n,
                        nanos: 0,
                    }),
                    lastPollStarted: new Timestamp({
                        seconds: 1000n,
                        nanos: 0,
                    }),
                    lastPollEnded: new Timestamp({
                        seconds: 0n,
                        nanos: 0,
                    }),
                }),
                scheduledTime: new Duration({
                    seconds: 300n,
                    nanos: 0,
                }),
                wakes: 1n,
                wakerClones: 1n,
                wakerDrops: 1n,
                lastWake: new Timestamp({
                    seconds: 1000n,
                    nanos: 0,
                }),
                selfWakes: 1n,
            }),
        );
        expect(taskStats.polls).toBe(100n);
        expect(taskStats.total).toEqual(
            new Duration({
                seconds: 1000n,
                nanos: 0,
            }),
        );
        expect(taskStats.createdAt).toEqual(
            new Timestamp({
                seconds: 0n,
                nanos: 0,
            }),
        );
        expect(taskStats.droppedAt).toEqual(
            new Timestamp({
                seconds: 1000n,
                nanos: 0,
            }),
        );
        expect(taskStats.busy).toEqual(
            new Duration({
                seconds: 500n,
                nanos: 0,
            }),
        );
        expect(taskStats.scheduled).toEqual(
            new Duration({
                seconds: 300n,
                nanos: 0,
            }),
        );
        expect(taskStats.lastPollStarted).toEqual(
            new Timestamp({
                seconds: 1000n,
                nanos: 0,
            }),
        );
        expect(taskStats.lastPollEnded).toEqual(
            new Timestamp({
                seconds: 0n,
                nanos: 0,
            }),
        );
        expect(taskStats.idle).toEqual(
            new Duration({
                seconds: 200n,
                nanos: 0,
            }),
        );
        expect(taskStats.wakes).toBe(1n);
        expect(taskStats.wakerClones).toBe(1n);
        expect(taskStats.wakerDrops).toBe(1n);
        expect(taskStats.lastWake).toEqual(
            new Timestamp({
                seconds: 1000n,
                nanos: 0,
            }),
        );
        expect(taskStats.selfWakes).toBe(1n);
    });
});
