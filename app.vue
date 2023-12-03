<template>
    <UCard>
        <template #header>
            <Placeholder class="h-8" />
        </template>

        <UTable :columns="columns" :rows="tasksData" />

        <template #footer>
            <Placeholder class="h-8" />
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "./gen/instrument_connect";
import { InstrumentRequest, Update } from "./gen/instrument_pb";
import { TaskUpdate } from "./gen/tasks_pb";
import { Field, type Metadata } from "./gen/common_pb";
import { Timestamp } from "./gen/google/protobuf/timestamp_pb";
import { Duration } from "./gen/google/protobuf/duration_pb";

const columns = [
    {
        key: "id",
        label: "ID",
    },
    {
        key: "name",
        label: "Name",
    },
    {
        key: "state",
        label: "State",
    },
    {
        key: "total",
        label: "Total",
    },
    {
        key: "busy",
        label: "Busy",
    },
    {
        key: "sched",
        label: "Scheduled",
    },
    {
        key: "idle",
        label: "Idle",
    },
    {
        key: "pools",
        label: "Pools",
    },
    {
        key: "kind",
        label: "Kind",
    },
    {
        key: "location",
        label: "Location",
    },
    {
        key: "fields",
        label: "Fields",
    },
];

const config = useRuntimeConfig();

const transport = createGrpcWebTransport({
    baseUrl: config.public.SUBSCRIBER_BASE_URL,
});
const client = createPromiseClient(Instrument, transport);
const updateStream: AsyncIterable<Update> = client.watchUpdates(
    new InstrumentRequest(),
);

const metas: Map<bigint, Metadata> = new Map();

interface TaskData {
    id: number | null | undefined;
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

const tasksData = ref<TaskData[]>([]);

const addNewTasks = (update: TaskUpdate) => {
    const tasks = update.newTasks;

    const statsUpdate = update.statsUpdate;
    for (const task of tasks) {
        if (!task.id) {
            console.warn("Task has no ID", task);
            return;
        }
        let metaId;
        if (task.metadata) {
            metaId = task.metadata.id;
        } else {
            console.warn(
                `Task has no metadata ID, skipping: ${JSON.stringify(task)}`,
            );
            return;
        }
        const meta = metas.get(metaId);
        if (!meta) {
            console.warn(
                `Task has no metadata, skipping: ${JSON.stringify(task)}`,
            );
            return;
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
            return;
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
            id: 1,
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

        tasksData.value.push(t);
    }
};

(async () => {
    for await (const update of updateStream) {
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
            addNewTasks(update.taskUpdate);
        }
    }
})();
</script>
