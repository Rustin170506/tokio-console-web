import { expect, it } from "vitest";
import { mountSuspended, mockNuxtImport } from "nuxt-vitest/utils";
import AsyncOpsTable from "~/components/AsyncOpsTable.vue";
import { Timestamp, Duration } from "~/types/common/duration";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";
import { AsyncOp } from "~/types/asyncOp/asyncOp";
import type { AsyncOpStats } from "~/types/asyncOp/asyncOpStats";

mockNuxtImport("useAsyncOps", () => {
    return () => {
        const pending = ref<boolean>(false);
        const asyncOpsData = ref<Map<bigint, AsyncOp>>(new Map());
        const stats: AsyncOpStats = {
            createdAt: new Timestamp(1000n, 0),
            droppedAt: new Timestamp(2000n, 0),
            total: new Duration(1000n, 0),
            busy: new Duration(500n, 0),
            idle: new Duration(500n, 0),
            lastPollStarted: new Timestamp(1500n, 0),
            lastPollEnded: undefined,
            taskId: 1n,
            taskIdStr: "1",
            attributes: [
                {
                    field: new Field(
                        "name",
                        new FieldValue(FieldValueType.Str, "test"),
                    ),
                    unit: "10ms",
                },
            ],
            polls: 10n,
        };
        asyncOpsData.value.set(
            1n,
            new AsyncOp(1n, "parent", 1n, 1n, "source", stats),
        );

        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));
        return { pending, asyncOpsData, lastUpdatedAt };
    };
});

it("AsyncOpsTable View", async () => {
    const component = await mountSuspended(AsyncOpsTable, {
        props: {
            resourceId: 1n,
        },
    });
    expect(component.element.querySelector("tbody")).toMatchSnapshot();
});
