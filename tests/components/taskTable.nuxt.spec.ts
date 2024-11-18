import { expect, it, describe } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createTask } from "./createTask";
import TaskTable from "~/components/TaskTable.vue";
import { TokioTask } from "~/types/task/tokioTask";
import { Timestamp } from "~/types/common/duration";
import { NeverYielded } from "~/types/warning/taskWarnings/neverYielded";
import { LostWaker } from "~/types/warning/taskWarnings/lostWaker";
import { SelfWakePercent } from "~/types/warning/taskWarnings/selfWakePercent";

mockNuxtImport("useTasks", () => {
    return () => {
        const pending = ref<boolean>(false);
        const tasksData = ref<Map<bigint, TokioTask>>(new Map());
        const task = createTask();
        task.warnings.push(new NeverYielded());
        task.warnings.push(new LostWaker());
        task.warnings.push(new SelfWakePercent());
        tasksData.value.set(1n, task);
        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));
        return { pending, tasksData, lastUpdatedAt };
    };
});

describe("TaskTable", () => {
    it("renders correctly", async () => {
        const component = await mountSuspended(TaskTable);
        expect(component.element.querySelector("tbody")).toMatchSnapshot();
    });

    it("displays correct number of columns", async () => {
        const component = await mountSuspended(TaskTable);
        const headers = component.findAll("th");
        expect(headers.length).toBe(11);
    });

    it("displays task data correctly", async () => {
        const component = await mountSuspended(TaskTable);
        const rows = component.findAll("tbody tr");
        expect(rows.length).toBe(1);
    });

    it("displays warning icon for tasks with warnings", async () => {
        const component = await mountSuspended(TaskTable);
        const warningIcon = component.find(
            ".i-heroicons\\:exclamation-triangle",
        );
        expect(warningIcon.exists()).toBe(true);
    });

    it("has total column sorted by default", async () => {
        const component = await mountSuspended(TaskTable);
        const totalHeader = component.find('th[aria-sort="descending"]');
        expect(totalHeader.exists()).toBe(true);
        expect(totalHeader.find("span").text()).toBe("Total");
    });
});
