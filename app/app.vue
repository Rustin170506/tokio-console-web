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

const settingsStore = useSettingsStore();
settingsStore.loadTargetUrl();
settingsStore.loadRetainFor();
</script>
