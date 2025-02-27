<template>
    <UCard>
        <template #header>
            <h3 class="text-xl font-semibold">Settings</h3>
        </template>
        <UForm
            :validate="validate"
            :state="state"
            class="space-y-4"
            @submit="saveSettings"
        >
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
            <UFormGroup label="Enabled Linters" name="enabledLinters">
                <div class="space-y-2">
                    <div class="flex items-center space-x-3">
                        <UToggle
                            v-model="state.enabledLinters.neverYielded"
                            color="blue"
                        />
                        <label class="text-sm font-medium text-gray-700"
                            >Never Yielded</label
                        >
                    </div>
                    <div class="flex items-center space-x-3">
                        <UToggle
                            v-model="state.enabledLinters.lostWaker"
                            color="blue"
                        />
                        <label class="text-sm font-medium text-gray-700"
                            >Lost Waker</label
                        >
                    </div>
                    <div class="flex items-center space-x-3">
                        <UToggle
                            v-model="state.enabledLinters.selfWakePercent"
                            color="blue"
                        />
                        <label class="text-sm font-medium text-gray-700"
                            >Self Wake Percent</label
                        >
                    </div>
                </div>
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

const defaultTargetUrl = "http://127.0.0.1:9999";

const state = reactive({
    targetUrl: settingsStore.targetUrl || defaultTargetUrl,
    retainFor: settingsStore.retainFor.seconds.toString(),
    enabledLinters: { ...settingsStore.enabledLinters },
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
    settingsStore.setEnabledLinters(state.enabledLinters);
    settingsStore.closeSettingsModal();

    if (needsReload) {
        window.location.reload();
    }
}
</script>
