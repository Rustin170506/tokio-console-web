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
        <template #location-data="{ row }">
            <LocationPopover :location="row.location" />
        </template>
        <template #fields-data="{ row }">
            <FieldsPopover :fields="row.fields" />
        </template>
        <template #state-data="{ row }">
            <UIcon :name="row.state" dynamic />
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
        <template #idString-data="{ row }">
            <div class="flex items-center">
                <span>{{ row.idString }}</span>
                <div
                    v-if="row.warnings.length > 0"
                    class="ml-2 flex items-center"
                >
                    <UIcon
                        name="i-heroicons-exclamation-triangle"
                        class="text-yellow-500 mr-1"
                    />
                </div>
            </div>
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
        class: "w-1/4",
    },
];

const router = useRouter();

// Select a task and navigate to its details page.
const select = (row: TaskTableItem) => {
    router.push(`/tasks/${row.id}`);
};

// Fetch tasks and convert them to a table item.
const { pending, tasksData, lastUpdatedAt } = useTasks();
const tasks = computed(() => {
    const lastUpdated = lastUpdatedAt.value;
    if (!lastUpdated) {
        return [];
    }
    return Array.from(tasksData.value.values()).reduce((acc, task) => {
        const taskTableItem = toTaskTableItem(task, lastUpdated);
        if (taskTableItem) {
            acc.push(taskTableItem);
        }
        return acc;
    }, [] as TaskTableItem[]);
});
</script>
