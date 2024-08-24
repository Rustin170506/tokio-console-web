<template>
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <h3 class="text-xl font-semibold">Settings</h3>
            </template>
            <form @submit.prevent="saveSettings">
                <UFormGroup label="Target URL">
                    <UInput
                        v-model="targetUrl"
                        placeholder="http://127.0.0.1:9999"
                    />
                </UFormGroup>
                <UButton type="submit" color="primary" class="mt-4"
                    >Save</UButton
                >
            </form>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "~/stores/settings";

const settingsStore = useSettingsStore();
const { isSettingsModalOpen, targetUrl } = storeToRefs(settingsStore);

function saveSettings() {
    settingsStore.setTargetUrl(targetUrl.value);
    settingsStore.closeSettingsModal();
    window.location.reload();
}

const isOpen = computed({
    get: () => isSettingsModalOpen.value,
    set: (value) => {
        if (!value) settingsStore.closeSettingsModal();
    },
});
</script>
