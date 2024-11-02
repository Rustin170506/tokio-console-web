import { expect, it } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createTask } from "./createTask";
import WarningList from "~/components/WarningList.vue";
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

it("WarningList View", async () => {
    const component = await mountSuspended(WarningList);
    expect(component.html()).toMatchSnapshot();
});