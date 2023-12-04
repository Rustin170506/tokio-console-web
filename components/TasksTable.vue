<template>
    <UTable :columns="columns" :rows="[]" />
</template>

<script setup lang="ts">
import { InstrumentRequest, Update } from "../gen/instrument_pb";
import { useGrpcClient } from "../composables/useGrpcClient";

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

const client = useGrpcClient();

onMounted(() => {
    const updateStream: AsyncIterable<Update> = client.watchUpdates(
        new InstrumentRequest(),
    );

    (async () => {
        for await (const value of updateStream) {
            console.log(value);
        }
    })();
});
</script>
