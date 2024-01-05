import { expect, it } from "vitest";
import { renderSuspended } from "nuxt-vitest/utils";
import ConsoleAnchor from "~/components/ConsoleAnchor.vue";

it("Console Anchor", async () => {
    const component = await renderSuspended(ConsoleAnchor);
    expect(component.html()).toMatchSnapshot();
});
