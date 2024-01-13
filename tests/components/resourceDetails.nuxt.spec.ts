import { expect, it } from "vitest";
import { mockNuxtImport, mountSuspended } from "nuxt-vitest/utils";
import ResourceDetails from "~/components/ResourceDetails.vue";
import { Timestamp } from "~/types/common/duration";
import { TokioResource, Visibility } from "~/types/resource/tokioResource";
import { fromProtoResourceStats } from "~/types/resource/tokioResourceStats";
import { Stats as ProtoResourceStats } from "~/gen/resources_pb";
import type { Metadata } from "~/types/common/metadata";

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

it("ResourceDetails", async () => {
    const component = await mountSuspended(ResourceDetails);
    expect(component.html()).toMatchSnapshot();
});
