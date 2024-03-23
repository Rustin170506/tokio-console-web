<template>
    <div>
        <UCard
            :ui="{
                body: {
                    base: 'xl:flex',
                },
            }"
        >
            <div class="space-y-2 flex-1 mr-4">
                <UDivider type="dotted">
                    <div
                        class="flex items-center text-black dark:text-white font-bold text-md"
                    >
                        <span>Resource</span>
                    </div>
                </UDivider>
                <InfoField name="ID" :value="resourceBasicInfo.id" />
                <InfoField name="Parent ID" :value="resourceBasicInfo.parent" />
                <InfoField name="Kind" :value="resourceBasicInfo.kind" />
                <InfoField name="Target" :value="resourceBasicInfo.target" />
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
            <UDivider class="w-px mx-2" color="gray" orientation="vertical" />
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
                        <span class="text-gray-500 dark:text-gray-400">=</span>
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
</template>
<script setup lang="ts">
import { toResourceBasicInfo } from "~/types/resourceBasicInfo";

const router = useRouter();
const resourceId = BigInt(useRoute().params.id as string);
const { resource, lastUpdatedAt } = useResourceDetails(resourceId);

if (!resource || !lastUpdatedAt.value) {
    router.push("/resources");
}

const resourceBasicInfo = computed(() =>
    toResourceBasicInfo(resource!, lastUpdatedAt.value!),
);
</script>
