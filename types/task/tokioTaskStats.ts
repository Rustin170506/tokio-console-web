import { Duration, Timestamp } from "../common/duration";
import type { Stats as ProtoTaskStats } from "~/gen/tasks_pb";

export interface TokioTaskStats {
    polls: bigint;
    createdAt: Timestamp;
    droppedAt?: Timestamp;
    busy: Duration;
    scheduled: Duration;
    lastPollStarted?: Timestamp;
    lastPollEnded?: Timestamp;
    idle?: Duration;
    total?: Duration;

    // === waker stats ===
    // Total number of times the task has been woken over its lifetime.
    wakes: bigint;
    // Total number of times the task's waker has been cloned
    wakerClones: bigint;
    // Total number of times the task's waker has been dropped.
    wakerDrops: bigint;
    // The timestamp of when the task was last woken.
    lastWake?: Timestamp;
    // Total number of times the task has woken itself.
    selfWakes: bigint;
}

export function fromProtoTaskStats(stats: ProtoTaskStats): TokioTaskStats {
    const createdAt = new Timestamp(
        stats.createdAt!.seconds,
        stats.createdAt!.nanos,
    );
    const droppedAt = stats.droppedAt
        ? new Timestamp(stats.droppedAt.seconds, stats.droppedAt.nanos)
        : undefined;
    const total = droppedAt?.subtract(createdAt);

    const pollStats = stats.pollStats!;
    const busy = new Duration(
        pollStats.busyTime?.seconds || 0n,
        pollStats.busyTime?.nanos || 0,
    );
    const scheduled = new Duration(
        stats.scheduledTime?.seconds || 0n,
        stats.scheduledTime?.nanos || 0,
    );
    const idle = total?.subtract(busy).subtract(scheduled);

    return {
        polls: pollStats.polls,
        createdAt,
        droppedAt,
        busy,
        scheduled,
        lastPollStarted: pollStats.lastPollStarted
            ? new Timestamp(
                  pollStats.lastPollStarted.seconds,
                  pollStats.lastPollStarted.nanos,
              )
            : undefined,
        lastPollEnded: pollStats.lastPollEnded
            ? new Timestamp(
                  pollStats.lastPollEnded.seconds,
                  pollStats.lastPollEnded.nanos,
              )
            : undefined,
        idle,
        total,
        wakes: stats.wakes,
        wakerClones: stats.wakerClones,
        wakerDrops: stats.wakerDrops,
        lastWake: stats.lastWake
            ? new Timestamp(stats.lastWake.seconds, stats.lastWake.nanos)
            : undefined,
        selfWakes: stats.selfWakes,
    };
}
