<template>
    <UTable
        :columns="columns"
        :rows="resources"
        :sort="{ column: 'id', direction: 'desc' }"
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
            <UPopover
                v-if="row.location && row.location.length > 50"
                mode="hover"
                :content="row.location"
            >
                <p>
                    {{ row.location.substring(0, 50) + "..." }}
                </p>
                <template #panel>
                    <div class="m-2">
                        {{ row.location }}
                    </div>
                </template>
            </UPopover>
            <div v-else-if="row.location" class="mb-1">
                {{ row.location }}
            </div>
        </template>
        <template #attributes-data="{ row }">
            <UPopover
                v-if="
                    row.attributes &&
                    row.attributes.length > 0 &&
                    (row.attributes[0].value.value.length > 20 ||
                        row.attributes.length > 1)
                "
                mode="hover"
                :content="row.attributes[0].value.value"
            >
                ...
                <template #panel>
                    <div
                        v-for="(attribute, index) in row.attributes"
                        :key="index"
                        class="m-2"
                    >
                        <p>
                            <span :class="attribute.name.class">{{
                                attribute.name.value
                            }}</span>
                            <span class="text-gray-500 dark:text-gray-400"
                                >=</span
                            >
                            <span :class="attribute.value.class">{{
                                attribute.value.value
                            }}</span>
                            <span :class="attribute.unit.class">{{
                                attribute.unit.value
                            }}</span>
                        </p>
                    </div>
                </template>
            </UPopover>
            <div
                v-else-if="row.attributes && row.attributes.length > 0"
                class="mb-1"
            >
                <p>
                    <span :class="row.attributes[0].name.class">{{
                        row.attributes[0].name.value
                    }}</span>
                    <span class="text-gray-500 dark:text-gray-400">=</span>
                    <span :class="row.attributes[0].value.class">{{
                        row.attributes[0].value.value
                    }}</span>
                    <span :class="row.attributes[0].unit.class">{{
                        row.attributes[0].unit.value
                    }}</span>
                </p>
            </div>
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
    return Array.from(resourcesData.value?.values() ?? [])
        .map((resource) => toResourceTableItem(resource, lastUpdatedAt.value!))
        .filter(Boolean) as ResourceTableItem[];
});
</script>
