<template>
    <UModal v-model="isOpen" :prevent-close="!canClose" @close="handleClose">
        <SettingsCard />
    </UModal>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import SettingsCard from "./SettingsCard.vue";
import { useSettingsStore } from "~/stores/settings";

const settingsStore = useSettingsStore();
const { isSettingsModalOpen } = storeToRefs(settingsStore);

const canClose = computed(() => !!settingsStore.targetUrl);

const isOpen = computed({
    get: () => isSettingsModalOpen.value,
    set: (value) => {
        if (!value && canClose.value) {
            settingsStore.closeSettingsModal();
        }
    },
});

function handleClose() {
    if (canClose.value) {
        settingsStore.closeSettingsModal();
    }
}
</script>
