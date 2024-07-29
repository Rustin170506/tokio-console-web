<template>
    <div class="p-4 flex-1 space-y-4">
        <template v-if="warnings.length">
            <UAlert
                v-for="(warning, index) in warnings"
                :key="`warning-${index}`"
                icon="i-heroicons-exclamation-triangle-20-solid"
                color="yellow"
                variant="outline"
                :title="warning.title"
                :description="warning.description"
            />
        </template>
        <div v-else class="flex flex-col justify-center items-center h-full">
            <div class="flex flex-col items-center justify-center p-4">
                <UIcon
                    name="i-heroicons-check-circle"
                    class="w-16 h-16 text-green-500"
                />
                <h3 class="mt-2 text-lg font-medium text-gray-900">
                    No Warnings
                </h3>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { toTaskWarningItems, type WarningItem } from "~/types/warningItem";

const { tasksData, lastUpdatedAt } = useTasks();
const warnings = computed(() => {
    const lastUpdated = lastUpdatedAt.value;
    if (!lastUpdated) {
        return [];
    }
    return Array.from(tasksData.value.values()).reduce((acc, task) => {
        const taskWarningItems = toTaskWarningItems(task.warnings);
        if (taskWarningItems) {
            acc.push(...taskWarningItems);
        }
        return acc;
    }, [] as WarningItem[]);
});
</script>
