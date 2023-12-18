import { expect, it } from "vitest";
import { renderSuspended } from "nuxt-vitest/utils";
import ConsoleHeader from "~/components/ConsoleHeader.vue";

it("Console Header", async () => {
    const component = await renderSuspended(ConsoleHeader);
    expect(component.html()).toMatchSnapshot();
});
