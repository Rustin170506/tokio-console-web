import { expect, it } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createTask } from "./createTask";
import WarningList from "~/components/WarningList.vue";
import { TokioTask } from "~/types/task/tokioTask";
import { Timestamp } from "~/types/common/duration";
import { NeverYielded } from "~/types/warning/taskWarnings/neverYielded";

mockNuxtImport("useTasks", () => {
    return () => {
        const pending = ref<boolean>(false);
        const tasksData = ref<Map<bigint, TokioTask>>(new Map());
        const task = createTask();
        task.warnings.push(new NeverYielded());
        tasksData.value.set(1n, task);
        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));
        return { pending, tasksData, lastUpdatedAt };
    };
});

it("WarningsSlideover View", async () => {
    const component = await mountSuspended(WarningList);
    expect(component.html()).toMatchSnapshot();
});
