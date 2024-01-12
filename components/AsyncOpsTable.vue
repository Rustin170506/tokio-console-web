<template>
    <UCard class="mt-4">
        <UDivider
            label="Async Ops"
            type="dotted"
            :ui="{
                label: 'text-black dark:text-white font-bold text-md',
            }"
        />
        <UTable
            :columns="columns"
            :rows="ops"
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
            <template #attributes-data="{ row }">
                <div v-if="row.attributes.length > 0">
                    <div
                        v-for="(item, index) in row.attributes"
                        :key="index"
                        class="mb-1 w-10"
                    >
                        <p>
                            <span :class="item.name.class">{{
                                item.name.value
                            }}</span>
                            <span class="text-gray-500 dark:text-gray-400"
                                >=</span
                            >
                            <span :class="item.value.class">{{
                                item.value.value
                            }}</span>
                            <span :class="item.unit.class">{{
                                item.unit.value
                            }}</span>
                        </p>
                    </div>
                </div>
                <UIcon v-else name="i-heroicons-minus-circle"></UIcon>
            </template>
        </UTable>
    </UCard>
</template>

<script lang="ts" setup>
import {
    toAsyncOpTableItem,
    type AsyncOpTableItem,
} from "~/types/asyncOpTableItem";

const props = defineProps<{
    resourceId: bigint;
}>();

const columns = [
    {
        key: "id",
        label: "ID",
        sortable: true,
    },
    {
        key: "parent",
        label: "Parent",
        sortable: true,
    },
    {
        key: "task",
        label: "Task",
        sortable: true,
    },
    {
        key: "source",
        label: "Source",
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
        key: "idle",
        label: "Idle",
        sortable: true,
    },
    {
        key: "polls",
        label: "Polls",
        sortable: true,
    },
    {
        key: "attributes",
        label: "Attributes",
    },
];

const router = useRouter();

const select = (row: AsyncOpTableItem) => {
    if (row.taskId) {
        router.push(`/tasks/${row.taskId}`);
    }
};

const { pending, asyncOpsData, lastUpdatedAt } = useAsyncOps();
const ops = computed(() => {
    if (lastUpdatedAt.value === undefined) {
        return [];
    }

    return Array.from(asyncOpsData.value.values())
        .filter((op) => op.resourceId === props.resourceId)
        .map((op) => toAsyncOpTableItem(op, lastUpdatedAt.value!))
        .filter((op) => op !== undefined) as AsyncOpTableItem[];
});
</script>
