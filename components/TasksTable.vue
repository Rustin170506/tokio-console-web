<template>
    <UTable
        :columns="columns"
        :rows="tasks"
        :sort="{ column: 'total', direction: 'desc' }"
    >
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
            <p :class="row.total.class">
                {{ row.total.value }}
            </p>
        </template>
        <template #busy-data="{ row }">
            <p :class="row.busy.class">
                {{ row.busy.value }}
            </p>
        </template>
        <template #sched-data="{ row }">
            <p :class="row.sched.class">
                {{ row.sched.value }}
            </p>
        </template>
        <template #idle-data="{ row }">
            <p :class="row.idle.class">
                {{ row.idle.value }}
            </p>
        </template>
    </UTable>
</template>

<script setup lang="ts">
const columns = [
    {
        key: "id",
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

const { tasksData } = useTasks();
const tasks = computed(() => {
    // Map to array.
    const tasks = Array.from(tasksData.value.values());
    const taskData: Array<TaskData> = tasks.map((task) => {
        return toTaskData(task);
    });
    return taskData;
});
</script>
