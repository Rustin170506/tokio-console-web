import { expect, it } from "vitest";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import ResourceDetails from "~/components/ResourceDetails.vue";
import { Duration, Timestamp } from "~/types/common/duration";
import { TokioResource, Visibility } from "~/types/resource/tokioResource";
import { fromProtoResourceStats } from "~/types/resource/tokioResourceStats";
import { Stats as ProtoResourceStats } from "~/gen/resources_pb";
import type { Metadata } from "~/types/common/metadata";
import { AsyncOp } from "~/types/asyncOp/asyncOp";
import type { AsyncOpStats } from "~/types/asyncOp/asyncOpStats";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";

mockNuxtImport("useRoute", () => {
    return () => {
        return {
            params: {
                id: "1",
            },
        };
    };
});

mockNuxtImport("useResourceDetails", () => {
    return (_id: bigint) => {
        const pending = ref<boolean>(false);
        const protoStats = new ProtoResourceStats({
            createdAt: { seconds: 1000n, nanos: 500 },
            droppedAt: { seconds: 2000n, nanos: 500 },
            attributes: [
                {
                    field: {
                        name: { case: "strName", value: "name" },
                        value: { case: "strVal", value: "test" },
                        metadataId: { id: 1n },
                    },
                    unit: "10ms",
                },
            ],
        });
        const metadata: Metadata = {
            id: 1n,
            target: "tokio::task",
            fieldNames: ["name"],
        };
        const stats = fromProtoResourceStats(protoStats, metadata);

        const resource = new TokioResource(
            1n,
            1n,
            "N/A",
            "N/A",
            1n,
            "Timer",
            stats,
            "tokio::time::driver::sleep",
            "Sleep",
            "console-subscriber/examples/grpc_web.rs:115:5",
            Visibility.Public,
        );
        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));

        return { pending, resource, lastUpdatedAt };
    };
});

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

it("ResourceDetails", async () => {
    const component = await mountSuspended(ResourceDetails);
    expect(component.html()).toMatchSnapshot();
});
