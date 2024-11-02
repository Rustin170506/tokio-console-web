import { defineStore } from "pinia";
import { Duration } from "~/types/common/duration";
import { NeverYielded } from "~/types/warning/taskWarnings/neverYielded";
import { LostWaker } from "~/types/warning/taskWarnings/lostWaker";
import { SelfWakePercent } from "~/types/warning/taskWarnings/selfWakePercent";
import type { Linter } from "~/types/warning/warn";
import type { TokioTask } from "~/types/task/tokioTask";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        targetUrl: "",
        isSettingsModalOpen: false,
        retainFor: new Duration(6n, 0),
        enabledLinters: {
            neverYielded: true,
            lostWaker: true,
            selfWakePercent: true,
        },
    }),
    getters: {
        isConfigured: (state) => !!state.targetUrl,
        activeLinters: (state): Array<Linter<TokioTask>> => {
            const linters: Array<Linter<TokioTask>> = [];
            if (state.enabledLinters.neverYielded)
                linters.push(new NeverYielded());
            if (state.enabledLinters.lostWaker) linters.push(new LostWaker());
            if (state.enabledLinters.selfWakePercent)
                linters.push(new SelfWakePercent());
            return linters;
        },
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
        setEnabledLinters(linters: { [key: string]: boolean }) {
            this.enabledLinters = { ...this.enabledLinters, ...linters };
            if (process.client) {
                localStorage.setItem(
                    "enabledLinters",
                    JSON.stringify(this.enabledLinters),
                );
            }
        },
        loadEnabledLinters() {
            if (process.client) {
                const storedLinters = localStorage.getItem("enabledLinters");
                if (storedLinters) {
                    this.enabledLinters = JSON.parse(storedLinters);
                }
            }
        },
    },
});
