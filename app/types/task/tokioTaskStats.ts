import { Duration, Timestamp } from "../common/duration";
import type { Stats as ProtoTaskStats } from "~/gen/tasks_pb";

export interface TokioTaskStats {
    polls: bigint;
    createdAt: Timestamp;
    droppedAt: Timestamp | null;
    busy: Duration;
    scheduled: Duration;
    lastPollStarted: Timestamp | null;
    lastPollEnded: Timestamp | null;
    idle: Duration | null;
    total: Duration | null;

    // === waker stats ===
    // Total number of times the task has been woken over its lifetime.
    wakes: bigint;
    // Total number of times the task's waker has been cloned
    wakerClones: bigint;
    // Total number of times the task's waker has been dropped.
    wakerDrops: bigint;
    // The timestamp of when the task was last woken.
    lastWake: Timestamp | null;
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
        : null;
    const total = droppedAt?.subtract(createdAt) || null;

    const pollStats = stats.pollStats!;
    const busy = new Duration(
        pollStats.busyTime?.seconds || BigInt(0),
        pollStats.busyTime?.nanos || 0,
    );
    const scheduled = new Duration(
        stats.scheduledTime?.seconds || BigInt(0),
        stats.scheduledTime?.nanos || 0,
    );
    const idle = total?.subtract(busy).subtract(scheduled) || null;

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
            : null,
        lastPollEnded: pollStats.lastPollEnded
            ? new Timestamp(
                  pollStats.lastPollEnded.seconds,
                  pollStats.lastPollEnded.nanos,
              )
            : null,
        idle,
        total,
        wakes: stats.wakes,
        wakerClones: stats.wakerClones,
        wakerDrops: stats.wakerDrops,
        lastWake: stats.lastWake
            ? new Timestamp(stats.lastWake.seconds, stats.lastWake.nanos)
            : null,
        selfWakes: stats.selfWakes,
    };
}
