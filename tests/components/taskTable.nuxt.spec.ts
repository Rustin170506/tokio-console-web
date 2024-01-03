import { expect, it } from "vitest";
import { mountSuspended, mockNuxtImport } from "nuxt-vitest/utils";
import TaskTable from "~/components/TaskTable.vue";
import { TokioTask } from "~/types/task/tokioTask";
import { Timestamp, Duration } from "~/types/task/duration";

mockNuxtImport("useTasks", () => {
    return () => {
        const pending = ref<boolean>(false);
        const tasksData = ref<Map<bigint, TokioTask>>(new Map());
        const formattedFields = [{ name: "target", value: "tokio:task" }];
        const stats = {
            polls: 100n,
            createdAt: new Duration(1000n, 0),
            busy: new Duration(500n, 0),
            scheduled: new Duration(300n, 0),
            // Use relative times to avoid test flakiness.
            lastPollStarted: new Duration(1000n, 0),
            lastPollEnded: new Timestamp(0n, 0),
            idle: new Duration(200n, 0),
            wakes: 1n,
            wakerClones: 1n,
            wakerDrops: 1n,
            selfWakes: 1n,
            lastWake: new Timestamp(1000n, 0),
        };
        tasksData.value.set(
            1n,
            new TokioTask(
                2n,
                1n,
                1n,
                "some task",
                formattedFields,
                stats,
                "tokio:task",
                "task1",
                "app.rs/68:10",
                "task",
            ),
        );
        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));

        return { pending, tasksData, lastUpdatedAt };
    };
});

it("TaskTable View", async () => {
    const component = await mountSuspended(TaskTable);
    expect(component.element.querySelector("tbody")).toMatchSnapshot();
});
