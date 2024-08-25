<template>
    <UCard>
        <template #header>
            <ConsoleHeader />
        </template>
        <NuxtPage />
        <ConsoleMenu />
        <UNotifications />
        <USlideovers />
    </UCard>
</template>

<script setup>
import { useSettingsStore } from "~/stores/settings";
import { initState } from "~/composables/state";

const settingsStore = useSettingsStore();
settingsStore.loadTargetUrl();
settingsStore.loadRetainFor();
settingsStore.loadEnabledLinters();
initState();
</script>
