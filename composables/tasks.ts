/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

import { Duration, Timestamp } from "@bufbuild/protobuf";
import { Field, Metadata } from "~/gen/common_pb";
import { InstrumentRequest, type Update } from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";

export interface TaskData {
    id: string | null | undefined;
    name: string | null | undefined;
    state: string;
    total: number;
    sched: bigint;
    idle: bigint;
    pools: bigint;
    kind: string | null | undefined;
    location: string | null | undefined;
    fields: Field[];
}

const metas: Map<bigint, Metadata> = new Map();

const taskUpdateToTaskData = (update: TaskUpdate): TaskData[] => {
    const result = new Array<TaskData>();
    const tasks = update.newTasks;
    const statsUpdate = update.statsUpdate;
    for (const task of tasks) {
        if (!task.id) {
            console.warn("Task has no ID", task);
            return result;
        }
        let metaId;
        if (task.metadata) {
            metaId = task.metadata.id;
        } else {
            console.warn("Task has no metadata ID", task);
            return result;
        }
        const meta = metas.get(metaId);
        if (!meta) {
            console.warn("Task has no metadata", task);
            return result;
        }
        let name;
        let taskID;
        let kind;
        const targetField = new Field({
            name: {
                value: "target",
                case: "strName",
            },
            value: {
                value: meta.target,
                case: "strVal",
            },
        });
        const fields: Field[] = [];
        for (let i = 0; i < task.fields.length; i++) {
            // TODO: validate fields.
            const field = fields[i];
            if (!field) continue;

            // the `task.name` field gets its own column, if it's present.
            switch (field.name.value) {
                case "task.name":
                    name = field.value;
                    break;
                case "task.id":
                    taskID = field.value.case === "u64Val" ? field.value : null;
                    break;
                case "kind":
                    kind = field.value;
                    break;
                default:
                    fields.push(field);
                    break;
            }
        }
        fields.push(targetField);
        const spanId = task.id.id;
        const stats = statsUpdate[spanId.toString()];
        if (!stats) {
            return result;
        }
        const droppedAt = stats.droppedAt || Timestamp.now();
        const createdAt = stats.createdAt || Timestamp.now();
        const total = droppedAt
            ? droppedAt.toDate().getTime() - createdAt.toDate().getTime()
            : 0;
        const busy = stats.pollStats!.busyTime || new Duration();
        const busyMs: bigint = busy.seconds * BigInt(1000);
        const scheduled = stats.scheduledTime || new Duration();
        const schedMs: bigint = scheduled.seconds * BigInt(1000);
        const idle = BigInt(total) - busyMs - schedMs;
        const t: TaskData = {
            id: taskID?.value.toString(),
            name: name?.value?.toString(),
            state: "running",
            total,
            sched: schedMs,
            idle,
            pools: stats.pollStats!.polls,
            kind: kind?.value?.toString(),
            location: meta.location?.toJsonString(),
            fields,
        };
        result.push(t);
    }

    return result;
};

export function useTasks() {
    const client = useGrpcClient();
    const updateStream: AsyncIterable<Update> = client.watchUpdates(
        new InstrumentRequest(),
    );

    const tasksData = ref<TaskData[]>([]);

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
            const tasks = taskUpdateToTaskData(update.taskUpdate);
            tasksData.value = tasksData.value.concat(tasks);
        }
    };

    (async () => {
        for await (const value of updateStream) {
            addTask(value);
        }
    })();

    return {
        tasksData,
        addTask,
    };
}
