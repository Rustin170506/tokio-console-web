import { expect, it } from "vitest";
import { renderSuspended } from "nuxt-vitest/utils";
import TaskInfoField from "~/components/TaskInfoField.vue";

it("TaskInfoField without slot", async () => {
    const component = await renderSuspended(TaskInfoField, {
        props: {
            name: "Test Name",
            value: "Test Value",
        },
    });
    expect(component.html()).toMatchSnapshot();
});

it("TaskInfoField with slot", async () => {
    const component = await renderSuspended(TaskInfoField, {
        props: {
            name: "Test Name",
        },
        slots: {
            default: () => "Test Slot Content",
        },
    });
    expect(component.html()).toMatchSnapshot();
});
