import { expect, it } from "vitest";
import { mountSuspended } from "nuxt-vitest/utils";
import TasksTable from "~/components/TasksTable.vue";

it("mount TasksTable", async () => {
    const component = await mountSuspended(TasksTable);
    expect(component.html()).not.toBe("");
});
