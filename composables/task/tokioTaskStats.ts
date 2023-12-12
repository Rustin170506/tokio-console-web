import { Duration } from "./duration";
import type { Stats as ProtoTaskStats } from "~/gen/tasks_pb";

export interface TokioTaskStats {
    polls: bigint;
    createdAt: Date;
    droppedAt?: Date;
    busy: Duration;
    scheduled: Duration;
    lastPollStarted?: Date;
    lastPollEnded?: Date;
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
    lastWake?: Date;
    // Total number of times the task has woken itself.
    selfWakes: bigint;
}

export function fromProtoTaskStats(stats: ProtoTaskStats) {
    const createdAt = stats.createdAt!.toDate();

    const droppedAt = stats.droppedAt?.toDate();
    const total = droppedAt
        ? new Duration(
              BigInt(
                  Math.floor(
                      (droppedAt.getTime() - createdAt.getTime()) / 1000,
                  ),
              ),
              0,
          )
        : undefined;

    const pollStats = stats.pollStats!;
    const busy = pollStats.busyTime
        ? new Duration(pollStats.busyTime.seconds, pollStats.busyTime.nanos)
        : new Duration(BigInt(0), 0);

    const scheduled = stats.scheduledTime
        ? new Duration(stats.scheduledTime.seconds, stats.scheduledTime.nanos)
        : new Duration(BigInt(0), 0);
    const idle = total ? total.subtract(busy).subtract(scheduled) : undefined;

    return {
        polls: pollStats.polls,
        createdAt,
        droppedAt,
        busy,
        scheduled,
        lastPollStarted: pollStats.lastPollStarted?.toDate(),
        lastPollEnded: pollStats.lastPollEnded?.toDate(),
        idle,
        total,
        wakes: stats.wakes,
        wakerClones: stats.wakerClones,
        wakerDrops: stats.wakerDrops,
        lastWake: stats.lastWake?.toDate(),
        selfWakes: stats.selfWakes,
    };
}
