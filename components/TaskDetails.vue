<template>
    <p v-if="!pending">{{ taskData.total }}</p>
    <p v-if="!pending">{{ taskDetails?.now }}</p>
</template>

<script setup lang="ts">
const route = useRoute();

const { pending, task, taskDetails } = useTaskDetails(
    BigInt(route.params.id as string),
);

const taskData = computed(() => {
    return toTaskData(task);
});
</script>
