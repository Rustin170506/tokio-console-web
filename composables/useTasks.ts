import { ConnectError } from "@connectrpc/connect";
import {
    type FormattedField,
    TokioTask,
    TaskState,
    formatLocation,
} from "./task/tokioTask";
import { Duration, Timestamp } from "./task/duration";
import { fromProtoTaskStats } from "./task/tokioTaskStats";
import { Metadata } from "~/gen/common_pb";
import { InstrumentRequest, type Update } from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";

export class DurationWithStyle {
    value: Duration;
    // The tailwind class to use for this duration.
    class: string;

    constructor(value: Duration, className: string) {
        this.value = value;
        this.class = className;
    }

    toString(): string {
        return this.value.toString();
    }

    valueOf(): number {
        return this.value.valueOf();
    }
}

function getDurationWithClass(duration: Duration): DurationWithStyle {
    const days = duration.asDays();
    const hours = duration.asHours();
    const minutes = duration.asMinutes();
    const seconds = duration.asSeconds();
    const milliseconds = duration.asMilliseconds();

    let className: string;

    if (days >= 1) {
        className = "text-blue-500 dark:text-blue-300";
    } else if (hours >= 1) {
        className = "text-cyan-500 dark:text-cyan-300";
    } else if (minutes >= 1) {
        className = "text-green-500 dark:text-green-300";
    } else if (seconds >= 1) {
        className = "text-yellow-500 dark:text-yellow-300";
    } else if (milliseconds >= 1) {
        className = "text-red-500 dark:text-red-300";
    } else {
        className = "text-gray-500 dark:text-gray-300";
    }

    return new DurationWithStyle(duration, className);
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

export interface TaskData {
    id: string;
    // Used to watch for task details.
    spanId: bigint;
    name: string;
    state: string;
    total: DurationWithStyle;
    busy: DurationWithStyle;
    sched: DurationWithStyle;
    idle: DurationWithStyle;
    pools: bigint;
    kind: string;
    location: string;
    fields: Array<FormattedField>;
    class?: string;
}

export function toTaskData(task: TokioTask): TaskData {
    return {
        id: task.taskId?.toString() ?? "",
        spanId: task.spanId,
        name: task.name ?? "",
        state: getTaskStateIconName(task.state()),
        total: getDurationWithClass(task.totalDuration(Timestamp.now())),
        busy: getDurationWithClass(task.busyDuration(Timestamp.now())),
        sched: getDurationWithClass(task.scheduledDuration(Timestamp.now())),
        idle: getDurationWithClass(task.idleDuration(Timestamp.now())),
        pools: task.stats.polls,
        kind: task.kind,
        location: task.location,
        fields: task.formattedFields,
        class:
            task.state() === TaskState.Completed
                ? "bg-slate-50 dark:bg-slate-950 animate-pulse"
                : undefined,
    };
}

// Metadata about a task.
const metas: Map<bigint, Metadata> = new Map();

const ids = {
    nextId: 1n,
    map: new Map(),
};

// How long to retain tasks after they're dropped.
// TODO: make this configurable.
const retainFor = new Duration(6n, 0); // 6 seconds

const taskUpdateToTasks = (update: TaskUpdate): TokioTask[] => {
    const result = new Array<TokioTask>();
    const tasks = update.newTasks;
    const statsUpdate = update.statsUpdate;

    for (const task of tasks) {
        if (!task.id) {
            continue;
        }
        let metaId;
        if (task.metadata) {
            metaId = task.metadata.id;
        } else {
            continue;
        }

        const meta = metas.get(metaId);
        if (!meta) {
            continue;
        }

        let name;
        let taskId;
        let kind = "";
        const targetField = {
            name: "target",
            value: meta.target,
        };

        const fields: FormattedField[] = [];
        for (let i = 0; i < task.fields.length; i++) {
            // TODO: validate fields.
            const field = task.fields[i];
            // the `task.name` field gets its own column, if it's present.
            switch (field.name.value) {
                case "task.name":
                    name = field.value.value!.toString();
                    break;
                case "task.id":
                    taskId =
                        field.value?.case === "u64Val"
                            ? field.value?.value
                            : undefined;
                    break;
                case "kind":
                    kind = field.value.value!.toString();
                    break;
                default:
                    fields.push({
                        name: field.name.value!.toString(),
                        value: field.value.value!.toString(),
                    });
                    break;
            }
        }
        fields.push(targetField);

        const spanId = task.id.id;
        const stats = statsUpdate[spanId.toString()];
        if (!stats) {
            continue;
        }
        // Delete
        delete statsUpdate[spanId.toString()];
        const taskStats = fromProtoTaskStats(stats);

        let id = ids.map.get(spanId);
        if (!id) {
            const newID = ids.nextId++;
            ids.map.set(spanId, newID);
            id = newID;
        }
        let shortDesc = "";
        if (taskId && name) {
            shortDesc = `${taskId} (${name})`;
        } else if (taskId) {
            shortDesc = taskId.toString();
        } else if (name) {
            shortDesc = name;
        }
        const location = formatLocation(task.location);

        const t: TokioTask = new TokioTask(
            id,
            taskId,
            spanId,
            shortDesc,
            fields,
            taskStats,
            meta.target,
            name,
            location,
            kind,
        );
        result.push(t);
    }

    return result;
};

export function useTasks() {
    const toast = useToast();
    const pending = ref<boolean>(true);
    const tasksData = ref<Map<bigint, TokioTask>>(new Map());

    const addTasks = (update: Update) => {
        if (update.newMetadata) {
            update.newMetadata.metadata.forEach((meta) => {
                const id = meta.id?.id;
                const metadata = meta.metadata;
                if (id && metadata) {
                    metas.set(id, metadata);
                }
            });
        }
        if (update.taskUpdate) {
            const tasks = taskUpdateToTasks(update.taskUpdate);

            for (const task of tasks) {
                tasksData.value.set(task.id, task);
            }

            for (const k in update.taskUpdate.statsUpdate) {
                const task = tasksData.value.get(ids.map.get(BigInt(k)));
                if (task) {
                    task.stats = fromProtoTaskStats(
                        update.taskUpdate.statsUpdate[k],
                    );
                    tasksData.value.set(task.id, task);
                }
            }
        }
    };

    const retainTasks = (retainFor: Duration) => {
        const newTasks = new Map<bigint, TokioTask>();
        for (const [id, task] of tasksData.value) {
            if (task.stats.droppedAt) {
                if (
                    !Timestamp.now()
                        .subtract(task.stats.droppedAt)
                        .greaterThan(retainFor)
                ) {
                    newTasks.set(id, task);
                }
            } else {
                newTasks.set(id, task);
            }
        }

        tasksData.value = newTasks;
    };

    // Async function to watch for updates.
    (async () => {
        try {
            const client = useGrpcClient();
            const updateStream = client.watchUpdates(new InstrumentRequest());

            for await (const value of updateStream) {
                if (pending.value) {
                    pending.value = false;
                }
                addTasks(value);
                retainTasks(retainFor);
            }
        } catch (err) {
            if (err instanceof ConnectError) {
                toast.add({
                    title: err.name,
                    description: err.rawMessage,
                    color: "red",
                });
            }
        } finally {
            pending.value = false;
        }
    })();

    return {
        pending,
        tasksData,
    };
}
