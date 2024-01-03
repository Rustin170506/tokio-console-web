<template>
    <UTable
        :columns="columns"
        :rows="tasks"
        :sort="{ column: 'total', direction: 'desc' }"
        :loading="pending"
        @select="select"
    >
        <template #loading-state>
            <div class="flex justify-center items-center h-full">
                <TokioSvg
                    class="w-8 h-auto mr-2 fill-black dark:fill-white my-8 animate-spin"
                />
            </div>
        </template>
        <template #fields-data="{ row }">
            <div v-for="(item, index) in row.fields" :key="index" class="mb-1">
                <p>
                    <span class="text-blue-600 dark:text-blue-400">{{
                        item.name
                    }}</span>
                    <span class="text-gray-500 dark:text-gray-400">=</span>
                    <span class="text-green-600 dark:text-green-400">{{
                        item.value
                    }}</span>
                </p>
            </div>
        </template>
        <template #state-data="{ row }">
            <UIcon :name="row.state" />
        </template>
        <template #total-data="{ row }">
            <p :class="`${row.total.class} w-10`">
                {{ row.total.toString() }}
            </p>
        </template>
        <template #busy-data="{ row }">
            <p :class="`${row.busy.class} w-10`">
                {{ row.busy.toString() }}
            </p>
        </template>
        <template #sched-data="{ row }">
            <p :class="`${row.sched.class} w-10`">
                {{ row.sched.toString() }}
            </p>
        </template>
        <template #idle-data="{ row }">
            <p :class="`${row.idle.class} w-10`">
                {{ row.idle.toString() }}
            </p>
        </template>
    </UTable>
</template>

<script setup lang="ts">
import { toTaskTableItem, type TaskTableItem } from "~/types/taskTableItem";

const columns = [
    {
        key: "idString",
        label: "ID",
        sortable: true,
    },
    {
        key: "name",
        label: "Name",
        sortable: true,
    },
    {
        key: "state",
        label: "State",
        sortable: true,
    },
    {
        key: "total",
        label: "Total",
        sortable: true,
    },
    {
        key: "busy",
        label: "Busy",
        sortable: true,
    },
    {
        key: "sched",
        label: "Scheduled",
        sortable: true,
    },
    {
        key: "idle",
        label: "Idle",
        sortable: true,
    },
    {
        key: "pools",
        label: "Pools",
        sortable: true,
    },
    {
        key: "kind",
        label: "Kind",
        sortable: true,
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

const router = useRouter();

const select = (row: TaskTableItem) => {
    router.push(`/tasks/${row.id}`);
};

const { pending, tasksData, lastUpdatedAt } = useTasks();
const tasks = computed(() => {
    // Map to array.
    const tasks = Array.from(tasksData.value.values());
    const taskList: Array<TaskTableItem | undefined> = tasks.map((task) => {
        if (lastUpdatedAt.value === undefined) {
            return undefined;
        }
        return toTaskTableItem(task, lastUpdatedAt.value);
    });
    return taskList.filter((task) => task !== undefined) as TaskTableItem[];
});
</script>
