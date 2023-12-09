import type { Duration } from "dayjs/plugin/duration";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Location } from "./../gen/common_pb";
import type { Stats as ProtoTaskStats } from "~/gen/tasks_pb";

// eslint-disable-next-line import/no-named-as-default-member
dayjs.extend(duration);

export interface TaskStats {
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
        ? dayjs.duration(dayjs(droppedAt).diff(dayjs(createdAt)))
        : undefined;

    const pollStats = stats.pollStats!;
    // FIXME: handle the nanos field.
    const busy = pollStats.busyTime
        ? dayjs.duration(
              (pollStats.busyTime.seconds * BigInt(1000)) as unknown as number,
          )
        : dayjs.duration(0);

    const scheduled = stats.scheduledTime
        ? dayjs.duration(
              (stats.scheduledTime.seconds * BigInt(1000)) as unknown as number,
          )
        : dayjs.duration(0);
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

export interface Task {
    // The task's pretty (console-generated, sequential) task ID.
    //
    // This is NOT the `tracing::span::Id` for the task's tracing span on the
    // remote.
    id: bigint;
    // The `tokio::task::Id` in the remote tokio runtime.
    taskId?: bigint;
    // The `tracing::span::Id` on the remote process for this task's span.
    //
    // This is used when requesting a task details stream
    spanId: bigint;
    // A precomputed short description string used in the async ops table
    shortDesc: string;
    // Fields that don't have their own column, pre-formatted
    formattedFields: Array<string>;
    // The task statistics that are updated over the lifetime of the task.
    stats: TaskStats;
    // The target of the span representing the task.
    target: string;
    // The name of the task
    name?: string;
    // The source file and line number the task was spawned from
    location: string;
    // The kind of task, currently one of task, blocking, block_on, local
    kind: string;
}

function truncateRegistryPath(s: string): string {
    const regex = /.*\/cargo(\/registry\/src\/[^/]*\/|\/git\/checkouts\/)/;
    return s.replace(regex, "<cargo>/");
}

export function formatLocation(loc?: Location): string {
    if (loc) {
        if (loc.file) {
            const truncated = truncateRegistryPath(loc.file);
            loc.file = truncated;
        }
        return loc.file ?? "<unknown file>";
    }
    return "<unknown location>";
}

export interface TaskData {
    id: bigint;
    name: string;
    state: string;
    total: string;
    busy: string;
    sched: string;
    idle: string;
    pools: bigint;
    kind: string;
    location: string;
    fields: Array<string>;
}

function formatLargestUnit(duration: Duration): string {
    if (duration.asDays() >= 1) {
        return `${Math.floor(duration.asDays())}d`;
    } else if (duration.asHours() >= 1) {
        return `${Math.floor(duration.asHours())}h`;
    } else if (duration.asMinutes() >= 1) {
        return `${Math.floor(duration.asMinutes())}m`;
    } else if (duration.asSeconds() >= 1) {
        return `${Math.floor(duration.asSeconds())}s`;
    } else {
        return `${Math.floor(duration.asMilliseconds())}ms`;
    }
}

export function toTaskData(task: Task): TaskData {
    return {
        id: task.id,
        name: task.name ?? "",
        // FIXME: use real state.
        state: "running",
        total: formatLargestUnit(task.stats.total ?? dayjs.duration(0)),
        busy: formatLargestUnit(task.stats.busy),
        sched: formatLargestUnit(task.stats.scheduled),
        idle: formatLargestUnit(task.stats.idle ?? dayjs.duration(0)),
        pools: task.stats.polls,
        kind: task.kind,
        location: task.location,
        fields: task.formattedFields,
    };
}
