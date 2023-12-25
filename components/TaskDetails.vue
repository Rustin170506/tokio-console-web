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
                    <TaskInfoField name="ID" :value="taskBasicInfo.idString" />
                    <TaskInfoField name="Name" :value="taskBasicInfo.name" />
                    <TaskInfoField
                        name="Location"
                        :value="taskBasicInfo.location"
                    />
                    <TaskInfoField name="Total" :value="taskBasicInfo.total" />
                    <TaskInfoField name="Busy">
                        <div class="flex">
                            <span :class="taskBasicInfo.busy.class">{{
                                taskBasicInfo.busy.value
                            }}</span>
                            <span class="mx-2">
                                ({{ taskBasicInfo.busyPercentage }})
                            </span>
                        </div>
                    </TaskInfoField>
                    <TaskInfoField name="Scheduled">
                        <div class="flex">
                            <span :class="taskBasicInfo.sched.class">{{
                                taskBasicInfo.sched.value
                            }}</span>
                            <span class="mx-2">
                                ({{ taskBasicInfo.scheduledPercentage }})
                            </span>
                        </div>
                    </TaskInfoField>
                    <TaskInfoField name="Idle">
                        <div class="flex">
                            <span :class="taskBasicInfo.idle.class">{{
                                taskBasicInfo.idle.value
                            }}</span>
                            <span class="mx-2">
                                ({{ taskBasicInfo.idlePercentage }})
                            </span>
                        </div>
                    </TaskInfoField>
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
                    <TaskInfoField class="ml-4" name="Current wakers">
                        <div class="flex">
                            <span class="mr-1">{{
                                taskBasicInfo.wakerCount
                            }}</span>
                            (
                            <TaskInfoField
                                name="Clones"
                                :value="taskBasicInfo.wakerClones"
                            />
                            <span class="mr-2">, </span>
                            <TaskInfoField
                                name="Drops"
                                :value="taskBasicInfo.wakerDrops"
                            />
                            )
                        </div>
                    </TaskInfoField>
                    <TaskInfoField class="ml-4" name="Woken">
                        <div class="flex">
                            <span class="mr-2">{{
                                `${taskBasicInfo.wakes} times,`
                            }}</span>
                            <TaskInfoField
                                v-if="
                                    taskBasicInfo.lastWokenDuration !==
                                    undefined
                                "
                                name="Last woken"
                            >
                                <span
                                    :class="
                                        taskBasicInfo.lastWokenDuration!.class
                                    "
                                >
                                    {{
                                        taskBasicInfo.lastWokenDuration!.toString()
                                    }}
                                </span>
                                <span class="mx-1">ago</span>
                            </TaskInfoField>
                        </div>
                    </TaskInfoField>
                </div>
            </UCard>
        </div>
    </div>
</template>
<script setup lang="ts">
const route = useRoute();

const { pending, task } = useTaskDetails(BigInt(route.params.id as string));

const taskBasicInfo = computed(() => {
    return toTaskBasicInfo(task);
});
</script>
