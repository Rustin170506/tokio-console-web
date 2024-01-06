import { expect, it } from "vitest";
import { mockNuxtImport, mountSuspended } from "nuxt-vitest/utils";
import TaskDetails from "~/components/TaskDetails.vue";
import { Duration, Timestamp } from "~/types/common/duration";
import { TokioTask } from "~/types/task/tokioTask";
import type { TokioTaskDetails } from "~/types/task/tokioTaskDetails";

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
            createdAt: new Duration(1000n, 0),
            busy: new Duration(500n, 0),
            scheduled: new Duration(300n, 0),
            lastPollStarted: new Duration(1000n, 0),
            lastPollEnded: new Timestamp(0n, 0),
            idle: new Duration(200n, 0),
            wakes: 1n,
            wakerClones: 199n,
            wakerDrops: 198n,
            selfWakes: 100n,
            lastWake: new Duration(1000n, 0),
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
        const taskDetails = ref<TokioTaskDetails>({
            pollTimes: {
                percentiles: [
                    { percentile: 0.1, duration: new Duration(100n, 0) },
                    { percentile: 0.25, duration: new Duration(200n, 0) },
                    { percentile: 0.5, duration: new Duration(300n, 0) },
                    { percentile: 0.75, duration: new Duration(400n, 0) },
                    { percentile: 0.9, duration: new Duration(700n, 0) },
                    { percentile: 0.95, duration: new Duration(800n, 0) },
                    { percentile: 0.99, duration: new Duration(990n, 0) },
                ],
                histogram: [
                    { duration: new Duration(100n, 0), count: 10n },
                    { duration: new Duration(200n, 0), count: 10n },
                    { duration: new Duration(300n, 0), count: 20n },
                    { duration: new Duration(400n, 0), count: 30n },
                    { duration: new Duration(500n, 0), count: 51n },
                    { duration: new Duration(600n, 0), count: 0n },
                    { duration: new Duration(700n, 0), count: 0n },
                    { duration: new Duration(800n, 0), count: 0n },
                    { duration: new Duration(900n, 0), count: 0n },
                    { duration: new Duration(1000n, 0), count: 1n },
                ],
                min: new Duration(100n, 0),
                max: new Duration(1000n, 0),
            },
            scheduledTimes: {
                percentiles: [
                    { percentile: 0.1, duration: new Duration(100n, 0) },
                    { percentile: 0.25, duration: new Duration(200n, 0) },
                    { percentile: 0.5, duration: new Duration(300n, 0) },
                    { percentile: 0.75, duration: new Duration(400n, 0) },
                    { percentile: 0.9, duration: new Duration(700n, 0) },
                    { percentile: 0.95, duration: new Duration(800n, 0) },
                    { percentile: 0.99, duration: new Duration(990n, 0) },
                ],
                histogram: [
                    { duration: new Duration(100n, 0), count: 10n },
                    { duration: new Duration(200n, 0), count: 10n },
                    { duration: new Duration(300n, 0), count: 20n },
                    { duration: new Duration(400n, 0), count: 30n },
                    { duration: new Duration(500n, 0), count: 51n },
                    { duration: new Duration(600n, 0), count: 0n },
                    { duration: new Duration(700n, 0), count: 0n },
                    { duration: new Duration(800n, 0), count: 0n },
                    { duration: new Duration(900n, 0), count: 0n },
                    { duration: new Duration(1000n, 0), count: 1n },
                ],
                min: new Duration(100n, 0),
                max: new Duration(1000n, 0),
            },
        });
        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));

        return { pending, task, taskDetails, lastUpdatedAt };
    };
});

it("TaskDetails", async () => {
    const component = await mountSuspended(TaskDetails);
    expect(component.html()).toMatchSnapshot();
});
