import { expect, it, describe } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import ResourceTable from "~/components/ResourceTable.vue";
import { Visibility, TokioResource } from "~/types/resource/tokioResource";
import { Timestamp } from "~/types/common/duration";
import type { TokioResourceStats } from "~/types/resource/tokioResourceStats";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";

mockNuxtImport("useResources", () => {
    return () => {
        const pending = ref<boolean>(false);
        const resourcesData = ref<Map<bigint, TokioResource>>(new Map());
        const stats: TokioResourceStats = {
            createdAt: new Timestamp(1000n, 0),
            droppedAt: new Timestamp(2000n, 0),
            total: new Timestamp(1000n, 0),
            attributes: [
                {
                    field: new Field(
                        "target",
                        new FieldValue(FieldValueType.Str, "tokio:task"),
                    ),
                    unit: "ms",
                },
            ],
        };
        resourcesData.value.set(
            1n,
            new TokioResource(
                1n,
                1n,
                "N/A",
                "N/A",
                1n,
                "Timer",
                stats,
                "target",
                "sleep",
                "app.rs/68:10",
                Visibility.Public,
            ),
        );

        const lastUpdatedAt = ref<Timestamp>(new Timestamp(1000n, 0));
        return { pending, resourcesData, lastUpdatedAt };
    };
});

describe("ResourceTable", () => {
    it("renders correctly", async () => {
        const component = await mountSuspended(ResourceTable);
        expect(component.element.querySelector("tbody")).toMatchSnapshot();
    });

    it("has id column sorted by default", async () => {
        const component = await mountSuspended(ResourceTable);
        const idHeader = component.find('th[aria-sort="descending"]');
        expect(idHeader.exists()).toBe(true);
        expect(idHeader.find("span").text()).toBe("ID");
    });
});
