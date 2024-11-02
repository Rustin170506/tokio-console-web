import { TaskState, TokioTask } from "../../task/tokioTask";
import { Duration, Timestamp } from "../../common/duration";
import { type Warn, Warning } from "../warn";

const DEFAULT_DURATION: Duration = new Duration(1n, 0);

// Warning for if a task has never yielded
export class NeverYielded implements Warn<TokioTask> {
    name: string;
    minDuration: Duration;
    description: string;

    constructor(minDuration: Duration = DEFAULT_DURATION) {
        this.name = "NeverYielded";
        this.minDuration = minDuration;
        this.description = `tasks have never yielded (threshold ${minDuration.toString()})`;
    }

    check(task: TokioTask): Warning {
        // Don't fire warning for tasks that are not async.
        if (task.isBlocking()) {
            return Warning.Ok;
        }
        // Don't fire warning for tasks that are waiting to run.
        if (task.state() !== TaskState.Running) {
            return Warning.Ok;
        }

        if (task.totalPolls() > 1n) {
            return Warning.Ok;
        }

        // Avoid short-lived task false positives
        const busy = task.busyDuration(Timestamp.now());
        if (busy.greaterThanOrEqual(this.minDuration)) {
            return Warning.Warn;
        } else {
            return Warning.Recheck;
        }
    }

    format(task: TokioTask): string {
        const busy = task.busyDuration(Timestamp.now()).toString();
        return `This task has never yielded (${busy})`;
    }

    summary(): string {
        return this.description;
    }
}
