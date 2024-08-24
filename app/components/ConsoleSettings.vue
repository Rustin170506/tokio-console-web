<template>
    <UModal v-model="isOpen" :prevent-close="!canClose" @close="handleClose">
        <UCard>
            <template #header>
                <h3 class="text-xl font-semibold">Settings</h3>
            </template>
            <UForm :validate="validate" :state="state" @submit="saveSettings">
                <UFormGroup label="Target URL" name="targetUrl">
                    <UInput
                        v-model="state.targetUrl"
                        placeholder="http://127.0.0.1:9999"
                        color="blue"
                    />
                </UFormGroup>
                <div class="flex justify-end mt-6">
                    <UButton
                        type="submit"
                        color="blue"
                        variant="soft"
                        icon="i-heroicons-rocket-launch"
                    >
                        Launch Changes
                    </UButton>
                </div>
            </UForm>
            <template #footer>
                <div class="flex flex-col items-center space-y-3">
                    <p class="text-sm text-gray-600">Connect with us</p>
                    <div class="flex space-x-4">
                        <UButton
                            color="gray"
                            variant="ghost"
                            to="https://github.com/Rustin170506/tokio-console-web"
                            target="_blank"
                            size="sm"
                            icon="i-simple-icons-github"
                            aria-label="GitHub"
                        >
                            GitHub
                        </UButton>
                        <UButton
                            color="gray"
                            variant="ghost"
                            to="https://discord.gg/EeF3cQw"
                            target="_blank"
                            size="sm"
                            icon="i-simple-icons-discord"
                            aria-label="Discord"
                        >
                            Discord
                        </UButton>
                    </div>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import type { FormError, FormSubmitEvent } from "#ui/types";
import { useSettingsStore } from "~/stores/settings";

const settingsStore = useSettingsStore();
const { isSettingsModalOpen } = storeToRefs(settingsStore);

const state = reactive({
    targetUrl: settingsStore.targetUrl,
});

const validate = (state: any): FormError[] => {
    const errors = [];
    if (!state.targetUrl) {
        errors.push({ path: "targetUrl", message: "Target URL is required" });
    }
    return errors;
};

function saveSettings(_event: FormSubmitEvent<any>) {
    settingsStore.setTargetUrl(state.targetUrl);
    settingsStore.closeSettingsModal();
    window.location.reload();
}

const canClose = computed(() => !!state.targetUrl);

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
