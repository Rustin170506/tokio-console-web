<template>
    <UTable :columns="columns" :rows="tasks">
        <template #fields-data="{ row }">
            <div
                v-for="(item, index) in row.fields"
                :key="index"
                class="field-item"
            >
                <p>
                    <span class="field-name">{{ item.name }}</span>
                    <span class="equals-sign">=</span>
                    <span class="field-value">{{ item.value }}</span>
                </p>
            </div>
        </template>
    </UTable>
</template>

<script setup lang="ts">
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

<style scoped>
.field-item {
    margin: 5px 0;
}

.field-name {
    color: #1f78b4;
}

.equals-sign {
    color: #999;
}

.field-value {
    color: #33a02c;
}
</style>
