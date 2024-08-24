<template>
    <CHeader>
        <template #left>
            <NuxtLink to="/">
                <TokioLogo />
            </NuxtLink>
        </template>

        <template #right>
            <WarningsButton />
            <CColorMode />
            <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-adjustments-horizontal"
                aria-label="Settings"
                @click="openSettings"
            />
        </template>
    </CHeader>
    <ConsoleSettings />
</template>

<script setup lang="ts">
import { useSettingsStore } from "~/stores/settings";

const settingsStore = useSettingsStore();

function openSettings() {
    settingsStore.openSettingsModal();
}
</script>
