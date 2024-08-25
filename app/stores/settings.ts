import { defineStore } from "pinia";
import { Duration } from "~/types/common/duration";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        targetUrl: "",
        isSettingsModalOpen: false,
        retainFor: new Duration(6n, 0),
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
        setRetainFor(seconds: number) {
            this.retainFor = new Duration(BigInt(seconds), 0);
            if (process.client) {
                localStorage.setItem("retainFor", seconds.toString());
            }
        },
        loadRetainFor() {
            if (process.client) {
                const retainFor = localStorage.getItem("retainFor");
                if (retainFor) {
                    this.retainFor = new Duration(BigInt(retainFor), 0);
                }
            }
        },
    },
});
