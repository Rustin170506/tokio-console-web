import { Warning, type Warn } from "../warn";
import { TokioTask } from "../../task/tokioTask";

const DEFAULT_PERCENT = 50;

export class SelfWakePercent implements Warn<TokioTask> {
    name: string;
    minPercent: number;
    description: string;

    constructor(minPercent: number = DEFAULT_PERCENT) {
        this.name = "NeverYielded";
        this.minPercent = minPercent;
        this.description = `tasks have woken themselves over ${minPercent}% of the time`;
    }

    check(task: TokioTask): Warning {
        // Don't fire warning for tasks that are not async
        if (task.isBlocking()) {
            return Warning.Ok;
        }
        const selfWakes = task.selfWakePercent();
        if (selfWakes > this.minPercent) {
            return Warning.Warn;
        } else {
            return Warning.Ok;
        }
    }

    format(task: TokioTask): string {
        const selfWakes = task.selfWakePercent();
        return `This task has woken itself for more than ${this.minPercent}% of its total wakeups (${selfWakes}%)`;
    }

    summary(): string {
        return this.description;
    }
}
