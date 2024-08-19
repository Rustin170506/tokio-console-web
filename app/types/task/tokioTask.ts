import { Duration, Timestamp } from "../common/duration";
import type { Field } from "../common/field";
import { Warning, type Linter, type Warn } from "../warning/warn";
import type { TokioTaskStats } from "./tokioTaskStats";

export enum TaskState {
    Completed,
    Running,
    Scheduled,
    Idle,
}

export enum TaskLintResult {
    Linted,
    RequiresRecheck,
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
    fields: Array<Field>;
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
    // Currently active warnings for this task.
    /* eslint-disable no-use-before-define */
    warnings: Array<Warn<TokioTask>>;

    constructor(
        id: bigint,
        taskId: bigint | undefined,
        spanId: bigint,
        shortDesc: string,
        formattedFields: Array<Field>,
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
        this.fields = formattedFields;
        this.stats = stats;
        this.target = target;
        this.name = name;
        this.location = location;
        this.kind = kind;
        this.warnings = [];
    }

    totalDuration(since: Timestamp): Duration {
        const duration = since.subtract(this.stats.createdAt);
        return this.stats.total ?? duration;
    }

    busyDuration(since: Timestamp): Duration {
        if (this.stats.lastPollStarted) {
            if (
                !this.stats.lastPollEnded ||
                this.stats.lastPollStarted > this.stats.lastPollEnded
            ) {
                // In this case the task is being polled at the moment.
                const currentTimeInPollDuration = since.subtract(
                    this.stats.lastPollStarted,
                );
                return this.stats.busy.add(currentTimeInPollDuration);
            }
        }
        return this.stats.busy;
    }

    scheduledDuration(since: Timestamp): Duration {
        if (this.stats.lastWake) {
            if (
                !this.stats.lastPollStarted ||
                this.stats.lastWake > this.stats.lastPollStarted
            ) {
                // In this case the task is scheduled, but has not yet been polled.
                const currentTimeSinceWakeDuration = since.subtract(
                    this.stats.lastWake,
                );
                return this.stats.scheduled.add(currentTimeSinceWakeDuration);
            }
        }
        return this.stats.scheduled;
    }

    idleDuration(since: Timestamp): Duration {
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

    isRunning(): boolean {
        if (this.stats.lastPollStarted && this.stats.lastPollEnded) {
            return this.stats.lastPollStarted.greaterThan(
                this.stats.lastPollEnded,
            );
        }
        if (
            this.stats.lastPollStarted &&
            this.stats.lastPollEnded === undefined
        ) {
            return true;
        }
        return false;
    }

    isScheduled(): boolean {
        if (this.stats.lastWake && this.stats.lastPollStarted) {
            return this.stats.lastWake.greaterThan(this.stats.lastPollStarted);
        }
        return false;
    }

    isCompleted(): boolean {
        return this.stats.total !== undefined;
    }

    isBlocking(): boolean {
        return ["block_on", "blocking"].includes(this.kind);
    }

    // Returns whether this task has signaled via its waker to run again.
    // Once the task has been polled, this is changed back to false.
    isAwakened(): boolean {
        // Before the first poll, the task is waiting on the executor to run it
        // for the first time.
        if (this.totalPolls() === 0n) {
            return true;
        }

        if (this.stats.lastWake && this.stats.lastPollStarted) {
            return this.stats.lastWake.greaterThan(this.stats.lastPollStarted);
        }

        if (this.stats.lastWake && this.stats.lastPollStarted === undefined) {
            return true;
        }

        return false;
    }

    totalPolls(): bigint {
        return this.stats.polls;
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

    wakerCount(): bigint {
        return this.stats.wakerClones - this.stats.wakerDrops > 0n
            ? this.stats.wakerClones - this.stats.wakerDrops
            : 0n;
    }

    /**
     * Returns the elapsed time since the task was last woken, relative to
     * given `now` timestamp.
     *
     * Returns `undefined` if the task has never been woken, or if it was last woken
     * more recently than `now` (which *shouldn't* happen as long as `now` is the
     * timestamp of the last stats update...)
     */
    sinceWakeDuration(now: Timestamp): Duration | undefined {
        if (this.stats.lastWake) {
            return now.subtract(this.stats.lastWake);
        }
    }

    durationPercent(now: Timestamp, amt: Duration): number {
        const total = this.totalDuration(now);
        let percent = (amt.asSeconds() / total.asSeconds()) * 100;
        if (percent > 100) {
            percent = 100;
        }

        return percent;
    }

    lint(linters: Array<Linter<TokioTask>>): TaskLintResult {
        this.warnings.length = 0;
        let recheck = false;
        linters.forEach((linter) => {
            const result = linter.check(this);
            switch (result) {
                case Warning.Ok:
                    break;
                case Warning.Recheck:
                    recheck = true;
                    break;
                case Warning.Warn:
                    this.warnings.push(linter);
                    break;
            }
        });
        if (recheck) {
            return TaskLintResult.RequiresRecheck;
        } else {
            return TaskLintResult.Linted;
        }
    }
}
