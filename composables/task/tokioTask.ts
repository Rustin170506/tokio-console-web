import type { TokioTaskStats } from "./tokioTaskStats";
import { Duration } from "./duration";
import { Location } from "~/gen/common_pb";

export enum TaskState {
    Completed,
    Running,
    Scheduled,
    Idle,
}

export function getTaskStateIconName(state: TaskState): string {
    switch (state) {
        case TaskState.Running:
            return "i-heroicons-play";
        case TaskState.Scheduled:
            return "i-heroicons-arrow-small-up";
        case TaskState.Idle:
            return "i-heroicons-pause";
        case TaskState.Completed:
            return "i-heroicons-stop";
        default:
            throw new Error("unreachable");
    }
}

export interface FormattedField {
    name: string;
    value: string;
}

export class TokioTask {
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
    formattedFields: Array<FormattedField>;
    // The task statistics that are updated over the lifetime of the task.
    stats: TokioTaskStats;
    // The target of the span representing the task.
    target: string;
    // The name of the task
    name?: string;
    // The source file and line number the task was spawned from
    location: string;
    // The kind of task, currently one of task, blocking, block_on, local
    kind: string;

    constructor(
        id: bigint,
        taskId: bigint | undefined,
        spanId: bigint,
        shortDesc: string,
        formattedFields: Array<FormattedField>,
        stats: TokioTaskStats,
        target: string,
        name: string | undefined,
        location: string,
        kind: string,
    ) {
        this.id = id;
        this.taskId = taskId;
        this.spanId = spanId;
        this.shortDesc = shortDesc;
        this.formattedFields = formattedFields;
        this.stats = stats;
        this.target = target;
        this.name = name;
        this.location = location;
        this.kind = kind;
    }

    totalDuration(since: Date): Duration {
        const durationInMilliseconds =
            since.getTime() - this.stats.createdAt.getTime();
        const durationInSeconds = Math.floor(durationInMilliseconds / 1000);

        const duration = new Duration(BigInt(durationInSeconds), 0);
        return this.stats.total ?? duration;
    }

    busyDuration(since: Date): Duration {
        if (this.stats.lastPollStarted && this.stats.lastPollEnded) {
            if (this.stats.lastPollStarted > this.stats.lastPollEnded) {
                // In this case the task is being polled at the moment.
                const currentTimeInPoll =
                    since.getTime() - this.stats.lastPollStarted.getTime();
                const currentTimeInPollInSeconds = Math.floor(
                    currentTimeInPoll / 1000,
                );
                const currentTimeInPollDuration = new Duration(
                    BigInt(currentTimeInPollInSeconds),
                    0,
                );
                return this.stats.busy.add(currentTimeInPollDuration);
            }
        }
        return this.stats.busy;
    }

    scheduledDuration(since: Date): Duration {
        if (this.stats.lastWake && this.stats.lastPollStarted) {
            if (this.stats.lastWake > this.stats.lastPollStarted) {
                // In this case the task is scheduled, but has not yet been polled.
                const currentTimeSinceWake =
                    since.getTime() - this.stats.lastWake.getTime();
                const currentTimeSinceWakeInSeconds = Math.floor(
                    currentTimeSinceWake / 1000,
                );
                const currentTimeSinceWakeDuration = new Duration(
                    BigInt(currentTimeSinceWakeInSeconds),
                    0,
                );
                return this.stats.scheduled.add(currentTimeSinceWakeDuration);
            }
        }
        return this.stats.scheduled;
    }

    idleDuration(since: Date): Duration {
        if (this.stats.idle) {
            return this.stats.idle;
        } else {
            const total = this.totalDuration(since);
            const busy = this.busyDuration(since);
            const scheduled = this.scheduledDuration(since);
            if (total.greaterThan(busy.add(scheduled))) {
                return total.subtract(busy.add(scheduled));
            }
        }
        return new Duration(BigInt(0), 0);
    }

    protected isRunning(): boolean {
        if (this.stats.lastPollStarted && this.stats.lastPollEnded) {
            return (
                this.stats.lastPollStarted.getTime() >
                this.stats.lastPollEnded.getTime()
            );
        }
        return false;
    }

    protected isScheduled(): boolean {
        if (this.stats.lastWake && this.stats.lastPollStarted) {
            return (
                this.stats.lastWake.getTime() >
                this.stats.lastPollStarted.getTime()
            );
        }
        return false;
    }

    protected isCompleted(): boolean {
        return this.stats.total !== undefined;
    }

    state(): TaskState {
        if (this.isCompleted()) {
            return TaskState.Completed;
        }

        if (this.isRunning()) {
            return TaskState.Running;
        }

        if (this.isScheduled()) {
            return TaskState.Scheduled;
        }

        return TaskState.Idle;
    }
}

function truncateRegistryPath(s: string): string {
    const regex = /.*\/cargo(\/registry\/src\/[^/]*\/|\/git\/checkouts\/)/;
    return s.replace(regex, "<cargo>/");
}

export function formatLocation(loc?: Location): string {
    if (loc) {
        let result = "";
        if (loc.modulePath) {
            result = loc.modulePath;
        } else if (loc.file) {
            const truncated = truncateRegistryPath(loc.file);
            result = truncated;
        } else {
            return "<unknown location>";
        }

        if (loc.line !== undefined) {
            result += `:${loc.line}`;

            if (loc.column !== undefined) {
                result += `:${loc.column}`;
            }
        }

        return result;
    }
    return "<unknown location>";
}
