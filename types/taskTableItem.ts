import {
    getDurationWithClass,
    type DurationWithStyle,
} from "./common/durationWithStyle";
import type { Timestamp } from "./common/duration";
import { TaskState, type TokioTask } from "./task/tokioTask";
import type { Field } from "./common/field";

export interface TaskTableItem {
    id: bigint;
    idString: string;
    name: string;
    state: string;
    total: DurationWithStyle;
    busy: DurationWithStyle;
    sched: DurationWithStyle;
    idle: DurationWithStyle;
    pools: bigint;
    kind: string;
    location: string;
    // TODO: format fields.
    fields: Array<Field>;
    class?: string;
}

export function toTaskTableItem(
    task: TokioTask,
    lastUpdatedAt: Timestamp,
): TaskTableItem {
    return {
        id: task.id,
        idString: task.taskId?.toString() ?? "",
        name: task.name ?? "",
        state: getTaskStateIconName(task.state()),
        total: getDurationWithClass(task.totalDuration(lastUpdatedAt)),
        busy: getDurationWithClass(task.busyDuration(lastUpdatedAt)),
        sched: getDurationWithClass(task.scheduledDuration(lastUpdatedAt)),
        idle: getDurationWithClass(task.idleDuration(lastUpdatedAt)),
        pools: task.stats.polls,
        kind: task.kind,
        location: task.location,
        fields: task.fields,
        class:
            task.state() === TaskState.Completed
                ? "bg-slate-50 dark:bg-slate-950 animate-pulse"
                : undefined,
    };
}

function getTaskStateIconName(state: TaskState): string {
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
