<template>
    <UTable
        v-model:sort="sort"
        :columns="columns"
        :rows="resources"
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
        <template #total-data="{ row }">
            <p :class="`${row.total.class} w-10`">
                {{ row.total.toString() }}
            </p>
        </template>
        <template #visibilityIcon-data="{ row }">
            <UIcon :name="row.visibilityIcon" dynamic />
        </template>
        <template #location-data="{ row }">
            <LocationPopover :location="row.location" />
        </template>
        <template #attributes-data="{ row }">
            <AttributesPopover :attributes="row.attributes" />
        </template>
    </UTable>
</template>

<script lang="ts" setup>
import { useResources } from "~/composables/resources";
import {
    toResourceTableItem,
    type ResourceTableItem,
} from "~/types/resourceTableItem";

const columns = [
    {
        key: "id",
        label: "ID",
        sortable: true,
    },
    {
        key: "parentId",
        label: "Parent",
        sortable: true,
    },
    {
        key: "kind",
        label: "Kind",
        sortable: true,
    },
    {
        key: "total",
        label: "Total",
        sortable: true,
    },
    {
        key: "target",
        label: "Target",
        sortable: true,
    },
    {
        key: "type",
        label: "Type",
        sortable: true,
    },
    {
        key: "visibilityIcon",
        label: "Visibility",
        sortable: true,
        class: "w-1",
    },
    {
        key: "location",
        label: "Location",
    },
    {
        key: "attributes",
        label: "Attributes",
    },
];
const router = useRouter();

const select = (row: ResourceTableItem) => {
    router.push(`/resources/${row.id}`);
};

const { pending, resourcesData, lastUpdatedAt } = useResources();
const resources = computed(() => {
    const lastUpdated = lastUpdatedAt.value;
    if (!lastUpdated) return [];

    return Array.from(resourcesData.value?.values() ?? [])
        .map((resource) => toResourceTableItem(resource, lastUpdated))
        .filter(Boolean) as ResourceTableItem[];
});

const sort = ref({
    column: "id",
    direction: "desc" as const,
});
</script>
