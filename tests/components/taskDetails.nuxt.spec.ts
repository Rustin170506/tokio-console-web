import { expect, it } from "vitest";
import { mockNuxtImport, mountSuspended } from "nuxt-vitest/utils";
import TaskDetails from "~/components/TaskDetails.vue";
import { Duration, Timestamp } from "~/composables/task/duration";
import { TokioTask } from "~/composables/task/tokioTask";

mockNuxtImport("useRoute", () => {
    return () => {
        return {
            params: {
                id: "1",
            },
        };
    };
});

mockNuxtImport("useTaskDetails", () => {
    return (_id: bigint) => {
        const pending = ref<boolean>(false);
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
            wakerClones: 199n,
            wakerDrops: 198n,
            selfWakes: 100n,
            lastWake: Timestamp.now().subtract(new Duration(1000n, 0)),
        };
        const task = new TokioTask(
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
        );

        return { pending, task };
    };
});

it("TaskDetails", async () => {
    const component = await mountSuspended(TaskDetails);
    expect(component.html()).toMatchSnapshot();
});
