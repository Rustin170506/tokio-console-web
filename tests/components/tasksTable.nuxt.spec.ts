import { expect, it } from "vitest";
import { mountSuspended, mockNuxtImport } from "nuxt-vitest/utils";
import TasksTable from "~/components/TasksTable.vue";
import { TokioTask } from "~/composables/task/tokioTask";
import { Timestamp, Duration } from "~/composables/task/duration";

mockNuxtImport("useTasks", () => {
    return () => {
        const pending = ref<boolean>(false);
        const tasksData = ref<Map<bigint, TokioTask>>(new Map());
        const formattedFields = [{ name: "target", value: "tokio:task" }];
        const stats = {
            polls: 100n,
            // Use relative times to avoid test flakiness.
            createdAt: Timestamp.now().subtract(new Duration(1000n, 0)),
            busy: new Duration(500n, 0),
            scheduled: new Duration(300n, 0),
            // Use relative times to avoid test flakiness.
            lastPollStarted: Timestamp.now().subtract(new Duration(1000n, 0)),
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
                1n,
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
        return { pending, tasksData };
    };
});

it("TasksTable View", async () => {
    const component = await mountSuspended(TasksTable);
    expect(component.element.querySelector("tbody")).toMatchSnapshot();
});
