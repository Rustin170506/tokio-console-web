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
            <UCard :ui="{ body: { base: 'flex' } }">
                <div class="space-y-2 flex-1">
                    <UDivider
                        label="Task"
                        type="dotted"
                        :ui="{
                            label: 'text-black dark:text-white font-bold text-md',
                        }"
                    />
                    <InfoField name="ID" :value="taskDetails.idString" />
                    <InfoField name="Name" :value="taskDetails.name" />
                    <InfoField name="Location" :value="taskDetails.location" />
                    <InfoField name="Total" :value="taskDetails.total" />
                    <InfoField name="Busy">
                        <div class="flex">
                            <span :class="taskDetails.busy.class">{{
                                taskDetails.busy.value
                            }}</span>
                            <span class="mx-2">
                                ({{ taskDetails.busyPercentage }})
                            </span>
                        </div>
                    </InfoField>
                    <InfoField name="Scheduled">
                        <div class="flex">
                            <span :class="taskDetails.sched.class">{{
                                taskDetails.sched.value
                            }}</span>
                            <span class="mx-2">
                                ({{ taskDetails.scheduledPercentage }})
                            </span>
                        </div>
                    </InfoField>
                    <InfoField name="Idle">
                        <div class="flex">
                            <span :class="taskDetails.idle.class">{{
                                taskDetails.idle.value
                            }}</span>
                            <span class="mx-2">
                                ({{ taskDetails.idlePercentage }})
                            </span>
                        </div>
                    </InfoField>
                </div>

                <UDivider
                    class="w-px mx-2"
                    color="gray"
                    orientation="vertical"
                />

                <div class="space-y-2 flex-1">
                    <UDivider
                        label="Waker"
                        type="dotted"
                        :ui="{
                            label: 'text-black dark:text-white font-bold text-md',
                        }"
                    />
                    <InfoField class="ml-4" name="Current wakers">
                        <div class="flex">
                            <span class="mr-1">{{
                                taskDetails.wakerCount
                            }}</span>
                            (
                            <InfoField
                                name="Clones"
                                :value="taskDetails.wakerClones"
                            />
                            <span class="mr-2">, </span>
                            <InfoField
                                name="Drops"
                                :value="taskDetails.wakerDrops"
                            />
                            )
                        </div>
                    </InfoField>
                    <InfoField class="ml-4" name="Woken">
                        <div class="flex">
                            <span class="mr-2">{{
                                `${taskDetails.wakes} times,`
                            }}</span>
                            <InfoField
                                v-if="
                                    taskDetails.lastWokenDuration !== undefined
                                "
                                name="Last woken"
                            >
                                <span
                                    :class="
                                        taskDetails.lastWokenDuration!.class
                                    "
                                >
                                    {{
                                        taskDetails.lastWokenDuration!.toString()
                                    }}
                                </span>
                                <span class="mx-1">ago</span>
                            </InfoField>
                        </div>
                    </InfoField>
                </div>
            </UCard>
        </div>
    </div>
</template>
<script setup lang="ts">
const route = useRoute();

const { pending, task } = useTaskDetails(BigInt(route.params.id as string));

const taskDetails = computed(() => {
    return toTaskDetailsData(task);
});
</script>
