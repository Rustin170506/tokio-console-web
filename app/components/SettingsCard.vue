<template>
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
            <UFormGroup label="Retain For (seconds)" name="retainFor">
                <UInput
                    v-model="state.retainFor"
                    type="number"
                    min="1"
                    placeholder="6"
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
                    Apply Changes
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
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "#ui/types";
import { useSettingsStore } from "~/stores/settings";
const settingsStore = useSettingsStore();

const state = reactive({
    targetUrl: settingsStore.targetUrl,
    retainFor: settingsStore.retainFor.seconds.toString(),
});

const validate = (state: any): FormError[] => {
    const errors = [];
    if (!state.targetUrl) {
        errors.push({ path: "targetUrl", message: "Target URL is required" });
    }
    if (!state.retainFor || parseInt(state.retainFor) < 1) {
        errors.push({
            path: "retainFor",
            message: "Retain For must be a positive number",
        });
    }
    return errors;
};

function saveSettings(_event: FormSubmitEvent<any>) {
    const needsReload = state.targetUrl !== settingsStore.targetUrl;

    settingsStore.setTargetUrl(state.targetUrl);
    settingsStore.setRetainFor(parseInt(state.retainFor));
    settingsStore.closeSettingsModal();

    if (needsReload) {
        window.location.reload();
    }
}
</script>
