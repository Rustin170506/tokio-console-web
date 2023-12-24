import { expect, it } from "vitest";
import { renderSuspended } from "nuxt-vitest/utils";
import InfoField from "~/components/InfoField.vue";

it("InfoField without slot", async () => {
    const component = await renderSuspended(InfoField, {
        props: {
            name: "Test Name",
            value: "Test Value",
        },
    });
    expect(component.html()).toMatchSnapshot();
});

it("InfoField with slot", async () => {
    const component = await renderSuspended(InfoField, {
        props: {
            name: "Test Name",
        },
        slots: {
            default: () => "Test Slot Content",
        },
    });
    expect(component.html()).toMatchSnapshot();
});
