import { TokioTask } from "../../task/tokioTask";
import { type Warn, Warning } from "../warn";

export class LostWaker implements Warn<TokioTask> {
    name: string;

    constructor() {
        this.name = "LostWaker";
    }

    check(task: TokioTask): Warning {
        // Don't fire warning for tasks that are not async.
        if (task.isBlocking()) return Warning.Ok;

        if (
            !task.isCompleted() &&
            task.wakerCount() === 0n &&
            !task.isRunning() &&
            !task.isAwakened()
        ) {
            return Warning.Warn;
        }

        return Warning.Ok;
    }

    format(_: TokioTask): string {
        return "This task has lost its waker, and will never be woken again.";
    }

    summary(): string {
        return "tasks have lost their wakers";
    }
}
