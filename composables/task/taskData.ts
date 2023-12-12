import { Duration } from "./duration";
import {
    getTaskStateIconName,
    type FormattedField,
    TokioTask,
    TaskState,
} from "./tokioTask";

export interface TaskData {
    id: bigint;
    name: string;
    state: string;
    total: Duration;
    busy: Duration;
    sched: Duration;
    idle: Duration;
    pools: bigint;
    kind: string;
    location: string;
    fields: Array<FormattedField>;
    class?: string;
}

export function toTaskData(task: TokioTask): TaskData {
    return {
        id: task.id,
        name: task.name ?? "",
        state: getTaskStateIconName(task.state()),
        total: task.totalDuration(new Date()),
        busy: task.busyDuration(new Date()),
        sched: task.scheduledDuration(new Date()),
        idle: task.idleDuration(new Date()),
        pools: task.stats.polls,
        kind: task.kind,
        location: task.location,
        fields: task.formattedFields,
        class:
            task.state() === TaskState.Completed
                ? "bg-slate-50 animate-pulse"
                : undefined,
    };
}
