import { formatLocation, fromProtoTaskStats, TokioTask } from "./task";
import { Metadata } from "~/gen/common_pb";
import { InstrumentRequest, type Update } from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";

// Metadata about a task.
const metas: Map<bigint, Metadata> = new Map();

const ids = {
    nextId: BigInt(0),
    ids: new Map(),
};

// How long to retain tasks after they're dropped.
// TODO: make this configurable.
const retainFor = 6000; // 6 seconds

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
        const targetField = `target = ${meta.target}`;

        const fields: string[] = [];
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
                    fields.push(
                        `${field.name.toString()} = ${field.value.toString()}`,
                    );
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

    const retainTasks = (retainFor: number) => {
        const newTasks = new Map<bigint, TokioTask>();
        for (const [id, task] of tasksData.value) {
            if (task.stats.droppedAt) {
                if (Date.now() - task.stats.droppedAt.getTime() < retainFor) {
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
