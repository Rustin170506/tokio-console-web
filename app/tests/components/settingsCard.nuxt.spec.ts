import { expect, it, describe, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { createTestingPinia } from "@pinia/testing";
import { useSettingsStore } from "~/stores/settings";
import SettingsCard from "~/components/SettingsCard.vue";

describe("SettingsCard", () => {
    it("contains necessary elements", async () => {
        const component = await mountSuspended(SettingsCard, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                    }),
                ],
            },
        });

        expect(component.find(".rounded-lg").exists()).toBe(true);
        expect(component.find("form").exists()).toBe(true);
        expect(component.find("label").exists()).toBe(true);
        expect(component.find('input[name="targetUrl"]').exists()).toBe(true);
        expect(component.find('button[type="submit"]').exists()).toBe(true);
    });

    it("displays the correct header and footer", async () => {
        const component = await mountSuspended(SettingsCard);

        expect(component.find("h3").text()).toBe("Settings");
        expect(component.find(".text-sm.text-gray-600").text()).toBe(
            "Connect with us",
        );
    });

    it("updates store and closes modal on form submission", async () => {
        const component = await mountSuspended(SettingsCard, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                    }),
                ],
            },
        });

        const settingsStore = useSettingsStore();
        const form = component.find("form");
        const input = component.find("input");

        await input.setValue("http://test.com");
        await form.trigger("submit");

        expect(settingsStore.setTargetUrl).toHaveBeenCalledWith(
            "http://test.com",
        );
        expect(settingsStore.closeSettingsModal).toHaveBeenCalled();
    });

    it("validates form input", async () => {
        const component = await mountSuspended(SettingsCard, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                    }),
                ],
            },
        });

        const form = component.find("form");
        await form.trigger("submit");

        // Assuming UForm displays error messages
        expect(component.text()).toContain("Target URL is required");
    });
});
