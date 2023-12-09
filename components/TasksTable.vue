<template>
    <UTable :columns="columns" :rows="[]" />
</template>

<script setup lang="ts">
const columns = [
    {
        key: "id",
        label: "ID",
    },
    {
        key: "name",
        label: "Name",
    },
    {
        key: "state",
        label: "State",
    },
    {
        key: "total",
        label: "Total",
    },
    {
        key: "busy",
        label: "Busy",
    },
    {
        key: "sched",
        label: "Scheduled",
    },
    {
        key: "idle",
        label: "Idle",
    },
    {
        key: "pools",
        label: "Pools",
    },
    {
        key: "kind",
        label: "Kind",
    },
    {
        key: "location",
        label: "Location",
    },
    {
        key: "fields",
        label: "Fields",
    },
];
</script>
