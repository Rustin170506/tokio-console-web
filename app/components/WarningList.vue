<template>
    <div class="p-4 flex-1 space-y-4">
        <template v-if="totalWarningsCount > 0">
            <UAlert
                v-for="stat in warningStats"
                :key="stat.name"
                icon="i-heroicons-exclamation-triangle-20-solid"
                color="yellow"
                variant="outline"
                :title="stat.name"
            >
                <template #description>
                    <p>{{ stat.count }} {{ stat.summary }}</p>
                </template>
            </UAlert>
        </template>
        <div v-else class="flex flex-col justify-center items-center h-full">
            <div class="flex flex-col items-center justify-center p-4">
                <UIcon
                    name="i-heroicons-check-circle"
                    class="w-16 h-16 text-blue-500"
                />
                <h3
                    class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                    No Warnings
                </h3>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { warningStats, totalWarningsCount } = useWarnings();
</script>
