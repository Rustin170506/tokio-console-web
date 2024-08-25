import { expect, it, describe, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { createTestingPinia } from "@pinia/testing";
import { useSettingsStore } from "~/stores/settings";
import ConsoleHeader from "~/components/ConsoleHeader.vue";

describe("ConsoleHeader", () => {
    it("contains necessary components", async () => {
        const component = await mountSuspended(ConsoleHeader);

        expect(component.findComponent({ name: "NuxtLink" }).exists()).toBe(
            true,
        );
        expect(component.findComponent({ name: "TokioLogo" }).exists()).toBe(
            true,
        );
        expect(
            component.findComponent({ name: "WarningsButton" }).exists(),
        ).toBe(true);
        expect(component.findComponent({ name: "CColorMode" }).exists()).toBe(
            true,
        );
        expect(component.find('button[aria-label="Settings"]').exists()).toBe(
            true,
        );
        expect(
            component.findComponent({ name: "ConsoleSettings" }).exists(),
        ).toBe(true);
    });

    it("opens settings when button is clicked", async () => {
        const component = await mountSuspended(ConsoleHeader, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                    }),
                ],
            },
        });

        const settingsButton = component.find('button[aria-label="Settings"]');
        await settingsButton.trigger("click");

        const settingsStore = useSettingsStore();
        expect(settingsStore.openSettingsModal).toHaveBeenCalled();
    });
});
