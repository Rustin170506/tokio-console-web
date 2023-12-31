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
                            <span>Task</span>
                            <UIcon :name="taskBasicInfo.state" />
                        </div>
                    </UDivider>
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

                <div class="space-y-2 xl:ml-4 flex-1">
                    <UDivider
                        label="Waker"
                        type="dotted"
                        :ui="{
                            label: 'text-black dark:text-white font-bold text-md',
                        }"
                    />
                    <TaskInfoField name="Current wakers">
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
                    <TaskInfoField name="Woken">
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
                    <UDivider
                        label="Fields"
                        type="dotted"
                        :ui="{
                            label: 'text-black dark:text-white font-bold text-md',
                        }"
                    />
                    <div
                        v-for="(item, index) in taskBasicInfo.fields"
                        :key="index"
                        class="mb-1"
                    >
                        <p>
                            <span class="text-blue-600 dark:text-blue-400">{{
                                item.name
                            }}</span>
                            <span class="text-gray-500 dark:text-gray-400"
                                >=</span
                            >
                            <span class="text-green-600 dark:text-green-400">{{
                                item.value
                            }}</span>
                        </p>
                    </div>
                </div>
            </UCard>
            <UCard class="mt-4" :ui="{ body: { base: 'xl:flex' } }">
                <div class="space-y-2 flex-1">
                    <div class="mt-2">
                        <div class="flex justify-center">
                            <TaskInfoField
                                name="Min"
                                :value="taskDetailsInfo.pollTimes.min"
                                class="mr-4"
                            />
                            <TaskInfoField
                                v-for="percentile in taskDetailsInfo.pollTimes.percentiles.slice(
                                    0,
                                    3,
                                )"
                                :key="percentile.percentile"
                                :name="percentile.percentile"
                                :value="percentile.duration"
                                class="mr-4"
                            />
                        </div>
                        <div class="flex justify-center">
                            <TaskInfoField
                                v-for="percentile in taskDetailsInfo.pollTimes.percentiles.slice(
                                    -4,
                                )"
                                :key="percentile.percentile"
                                :name="percentile.percentile"
                                :value="percentile.duration"
                                class="mr-4"
                            />
                            <TaskInfoField
                                name="Max"
                                :value="taskDetailsInfo.pollTimes.max"
                                class="mr-4"
                            />
                        </div>
                    </div>
                    <div class="space-y-2 h-80 w-11/12">
                        <HistogramChart :data="pollTimesHistogramData" />
                    </div>
                </div>

                <UDivider
                    v-if="taskDetailsInfo.scheduledTimes !== undefined"
                    class="w-px mx-2"
                    color="gray"
                    orientation="vertical"
                />

                <div
                    v-if="taskDetailsInfo.scheduledTimes !== undefined"
                    class="space-y-2 xl:ml-4 flex-1"
                >
                    <div class="mt-2">
                        <div class="flex justify-center">
                            <TaskInfoField
                                name="Min"
                                :value="taskDetailsInfo.scheduledTimes.min"
                                class="mr-4"
                            />
                            <TaskInfoField
                                v-for="percentile in taskDetailsInfo.scheduledTimes.percentiles.slice(
                                    0,
                                    3,
                                )"
                                :key="percentile.percentile"
                                :name="percentile.percentile"
                                :value="percentile.duration"
                                class="mr-4"
                            />
                        </div>
                        <div class="flex justify-center">
                            <TaskInfoField
                                v-for="percentile in taskDetailsInfo.scheduledTimes.percentiles.slice(
                                    -4,
                                )"
                                :key="percentile.percentile"
                                :name="percentile.percentile"
                                :value="percentile.duration"
                                class="mr-4"
                            />
                            <TaskInfoField
                                name="Max"
                                :value="taskDetailsInfo.scheduledTimes.max"
                                class="mr-4"
                            />
                        </div>
                    </div>
                    <div class="space-y-2 h-80 w-11/12">
                        <HistogramChart :data="scheduledTimesHistogramData" />
                    </div>
                </div>
            </UCard>
        </div>
    </div>
</template>
<script setup lang="ts">
const router = useRouter();
const route = useRoute();

const { pending, task, taskDetails } = useTaskDetails(
    BigInt(route.params.id as string),
);

// If the task is undefined, redirect to the home page.
if (task === undefined) {
    router.push("/");
}

const taskBasicInfo = computed(() => {
    return toTaskBasicInfo(task!);
});

const taskDetailsInfo = computed(() => {
    return toTaskDetails(taskDetails.value);
});

function createHistogramData(times: TimesDetails | undefined, label: string) {
    if (times === undefined) {
        return undefined;
    }

    return {
        labels: times.histogram.map((h) => h.duration.toString()),
        datasets: [
            {
                label,
                data: times.histogram.map((h) => h.count),
            },
        ],
    };
}

const pollTimesHistogramData = computed(() => {
    return createHistogramData(taskDetailsInfo.value.pollTimes, "Poll Times");
});

const scheduledTimesHistogramData = computed(() => {
    return createHistogramData(
        taskDetailsInfo.value.scheduledTimes,
        "Scheduled Times",
    );
});
</script>
