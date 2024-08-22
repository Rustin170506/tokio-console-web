import { expect, it, describe, vi } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import WarningsButton from "~/components/WarningsButton.vue";

const mockOpen = vi.fn();
// Mock the useSlideover composable
mockNuxtImport("useSlideover", () => {
    return () => ({
        open: mockOpen,
    });
});

// Mock the useWarnings composable
const mockWarningsCount = vi.fn(() => 0);
mockNuxtImport("useWarnings", () => {
    return () => ({
        warningsCount: mockWarningsCount(),
    });
});

describe("WarningsButton", () => {
    it("renders UButton when warningsCount is 0", async () => {
        mockWarningsCount.mockReturnValue(0);
        const component = await mountSuspended(WarningsButton);
        expect(component.find("button").exists()).toBe(true);
        // Check if the warning indicator is not present.
        expect(component.find(".absolute").exists()).toBe(false);
    });

    it("renders warning indicator with UButton when warningsCount is greater than 0", async () => {
        mockWarningsCount.mockReturnValue(1);
        const component = await mountSuspended(WarningsButton);
        // Use nextTick to wait for the component to update
        await component.vm.$nextTick();
        // Check if the warning indicator is present.
        expect(component.find(".absolute").exists()).toBe(true);
        expect(component.find("button").exists()).toBe(true);
    });

    it("calls openSlideover when button is clicked", async () => {
        mockWarningsCount.mockReturnValue(0);
        const component = await mountSuspended(WarningsButton);
        const button = component.find("button");
        await button.trigger("click");

        // Use nextTick to wait for the click event to be processed
        await component.vm.$nextTick();
        expect(mockOpen).toHaveBeenCalledWith(expect.any(Object)); // WarningsSlideover component
    });
});
