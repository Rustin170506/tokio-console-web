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

if (process.client) {
    const settingsStore = useSettingsStore();
    settingsStore.loadTargetUrl();
}
</script>
