import {
    getTaskStateIconName,
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
        total: task.totalDuration(Timestamp.now()),
        busy: task.busyDuration(Timestamp.now()),
        sched: task.scheduledDuration(Timestamp.now()),
        idle: task.idleDuration(Timestamp.now()),
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
    nextId: BigInt(0),
    ids: new Map(),
};

// How long to retain tasks after they're dropped.
// TODO: make this configurable.
const retainFor = new Duration(6n, 0); // 6 seconds

const taskUpdateToTask = (update: TaskUpdate): TokioTask[] => {
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

        let id = ids.ids.get(spanId);
        if (!id) {
            const newID = ids.nextId++;
            ids.ids.set(spanId, newID);
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
    const client = useGrpcClient();
    const updateStream: AsyncIterable<Update> = client.watchUpdates(
        new InstrumentRequest(),
    );

    const tasksData = ref<Map<bigint, TokioTask>>(new Map());

    const addTask = (update: Update) => {
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
            const tasks = taskUpdateToTask(update.taskUpdate);

            for (const task of tasks) {
                tasksData.value.set(task.id, task);
            }

            for (const k in update.taskUpdate.statsUpdate) {
                const task = tasksData.value.get(ids.ids.get(BigInt(k)));
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

    (async () => {
        for await (const value of updateStream) {
            addTask(value);
            retainTasks(retainFor);
        }
    })();

    return {
        tasksData,
    };
}
