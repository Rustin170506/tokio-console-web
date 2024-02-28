import { expect, it } from "vitest";
import { renderSuspended } from "@nuxt/test-utils/runtime";
import ConsoleAnchor from "~/components/ConsoleAnchor.vue";

it("Console Anchor", async () => {
    const component = await renderSuspended(ConsoleAnchor);
    expect(component.html()).toMatchSnapshot();
});
