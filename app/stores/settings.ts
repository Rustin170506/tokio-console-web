import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        targetUrl: "",
        isSettingsModalOpen: false,
    }),
    getters: {
        isConfigured: (state) => !!state.targetUrl,
    },
    actions: {
        setTargetUrl(url: string) {
            this.targetUrl = url;
            if (process.client) {
                localStorage.setItem("targetUrl", url);
            }
        },
        loadTargetUrl() {
            if (process.client) {
                this.targetUrl = localStorage.getItem("targetUrl") || "";
            }
        },
        openSettingsModal() {
            this.isSettingsModalOpen = true;
        },
        closeSettingsModal() {
            this.isSettingsModalOpen = false;
        },
    },
});
