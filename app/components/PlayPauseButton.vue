<template>
    <UIcon
        :name="paused ? 'i-heroicons-play' : 'i-heroicons-pause'"
        dynamic
        @click="toggle"
    />
</template>

<script setup>
import { useStorage } from "@vueuse/core";

// Store the paused state in local storage to avoid losing it on page reload.
// See more: https://github.com/tokio-rs/console/issues/551
// TODO: we should use a better way to determine if the app is paused or not.
const paused = useStorage("paused", false);

const toggle = async () => {
    const client = await grpcClient();
    if (paused.value) {
        await client.resume();
    } else {
        await client.pause();
    }
    paused.value = !paused.value;
};
</script>
