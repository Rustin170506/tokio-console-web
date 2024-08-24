<template>
    <CHeader>
        <template #left>
            <NuxtLink to="/">
                <TokioLogo />
            </NuxtLink>
        </template>

        <template #right>
            <WarningsButton />
            <UButton
                color="gray"
                variant="ghost"
                to="https://github.com/hi-rustin/tokio-console-web"
                target="_blank"
                size="lg"
                icon="i-simple-icons-github"
                aria-label="GitHub"
            />
            <UButton
                color="gray"
                variant="ghost"
                to="https://discord.gg/EeF3cQw"
                target="_blank"
                size="lg"
                icon="i-simple-icons-discord"
                aria-label="GitHub"
            />
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
