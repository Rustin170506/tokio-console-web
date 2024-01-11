<template>
    <div>
        <div v-if="pending" class="flex items-center space-x-4">
            <USkeleton class="h-12 w-12" :ui="{ rounded: 'rounded-full' }" />
            <div class="space-y-2">
                <USkeleton class="h-4 w-[250px]" />
                <USkeleton class="h-4 w-[200px]" />
            </div>
        </div>
        <div v-else>
            <UCard
                :ui="{
                    body: {
                        base: 'xl:flex',
                    },
                }"
            >
                <div class="space-y-2 flex-1">
                    <UDivider type="dotted">
                        <div
                            class="flex items-center text-black dark:text-white font-bold text-md"
                        >
                            <span>Resource</span>
                        </div>
                    </UDivider>
                    <InfoField name="ID" :value="resourceBasicInfo.id" />
                    <InfoField
                        name="Parent ID"
                        :value="resourceBasicInfo.parent"
                    />
                    <InfoField name="Kind" :value="resourceBasicInfo.kind" />
                    <InfoField
                        name="Target"
                        :value="resourceBasicInfo.target"
                    />
                    <InfoField name="Type" :value="resourceBasicInfo.type" />
                    <InfoField name="Visibility">
                        <div class="flex justify-center items-center">
                            <UIcon
                                :name="resourceBasicInfo.visibilityIcon"
                                dynamic
                            />
                        </div>
                    </InfoField>
                    <InfoField
                        name="Location"
                        :value="resourceBasicInfo.location"
                    />
                </div>
                <UDivider
                    class="w-px mx-2"
                    color="gray"
                    orientation="vertical"
                />
                <div class="space-y-2 xl:ml-4 flex-1">
                    <UDivider
                        label="Attributes"
                        type="dotted"
                        :ui="{
                            label: 'text-black dark:text-white font-bold text-md',
                        }"
                    />
                    <div
                        v-for="(item, index) in resourceBasicInfo.attributes"
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
            </UCard>
            <AsyncOpsTable :resource-id="resourceId" />
        </div>
    </div>
</template>
<script setup lang="ts">
import { toResourceBasicInfo } from "~/types/resourceBasicInfo";

const router = useRouter();
const route = useRoute();
const resourceId = BigInt(route.params.id as string);
const { pending, resource, lastUpdatedAt } = useResourceDetails(resourceId);

if (resource === undefined || lastUpdatedAt.value === undefined) {
    router.push("/resources");
}

const resourceBasicInfo = computed(() => {
    return toResourceBasicInfo(resource!, lastUpdatedAt.value!);
});
</script>
