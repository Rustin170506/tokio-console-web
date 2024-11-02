import { expect, it } from "vitest";
import { renderSuspended } from "@nuxt/test-utils/runtime";
import ConsoleMenu from "~/components/ConsoleMenu.vue";

it("Console Menu", async () => {
    const component = await renderSuspended(ConsoleMenu);
    expect(component.html()).toMatchSnapshot();
});
