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
        expect(component.find('input[name="retainFor"]').exists()).toBe(true);
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
        const targetUrlInput = component.find('input[name="targetUrl"]');
        const retainForInput = component.find('input[name="retainFor"]');

        await targetUrlInput.setValue("http://test.com");
        await retainForInput.setValue("10");
        await form.trigger("submit");

        expect(settingsStore.setTargetUrl).toHaveBeenCalledWith(
            "http://test.com",
        );
        expect(settingsStore.setRetainFor).toHaveBeenCalledWith(10);
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
        const targetUrlInput = component.find('input[name="targetUrl"]');
        await targetUrlInput.setValue("");
        // Change the retain for to a negative number.
        const retainForInput = component.find('input[name="retainFor"]');
        await retainForInput.setValue("-1");
        await form.trigger("submit");

        expect(component.text()).toContain("Target URL is required");
        expect(component.text()).toContain(
            "Retain For must be a positive number",
        );
    });

    it("reloads page when target URL changes", async () => {
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
        settingsStore.targetUrl = "http://old.com";

        const form = component.find("form");
        const targetUrlInput = component.find('input[name="targetUrl"]');
        const retainForInput = component.find('input[name="retainFor"]');

        await targetUrlInput.setValue("http://new.com");
        await retainForInput.setValue("10");

        const reloadSpy = vi
            .spyOn(window.location, "reload")
            .mockImplementation(() => {});

        await form.trigger("submit");

        expect(reloadSpy).toHaveBeenCalled();

        reloadSpy.mockRestore();
    });

    it("contains linter toggle elements with correct labels", async () => {
        const component = await mountSuspended(SettingsCard, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                    }),
                ],
            },
        });

        // Check for the presence of toggle buttons
        expect(component.findAll('button[role="switch"]')).toHaveLength(3);

        // Check for the presence of labels
        const labels = component.findAll(
            "label.text-sm.font-medium.text-gray-700",
        );
        expect(labels).toHaveLength(3);

        const labelTexts = labels.map((label) => label.text());
        expect(labelTexts).toContain("Never Yielded");
        expect(labelTexts).toContain("Lost Waker");
        expect(labelTexts).toContain("Self Wake Percent");
    });

    it("updates store with linter settings on form submission", async () => {
        const component = await mountSuspended(SettingsCard, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                    }),
                ],
            },
        });

        // Set other fields to some values
        const targetUrlInput = component.find('input[name="targetUrl"]');
        await targetUrlInput.setValue("http://test.com");
        const retainForInput = component.find('input[name="retainFor"]');
        await retainForInput.setValue("10");

        const settingsStore = useSettingsStore();
        const form = component.find("form");
        const toggleButtons = component.findAll('button[role="switch"]');

        // Toggle the buttons (this will change their state)
        await toggleButtons[0].trigger("click");
        await toggleButtons[1].trigger("click");
        // We leave the third toggle as is

        await form.trigger("submit");

        expect(settingsStore.setEnabledLinters).toHaveBeenCalledWith({
            neverYielded: false, // Toggled from true to false
            lostWaker: false, // Toggled from true to false
            selfWakePercent: true, // Unchanged
        });
    });
});
