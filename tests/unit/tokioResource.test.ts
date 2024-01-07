import { describe, test, beforeEach, expect } from "vitest";
import { TokioResource, Visibility } from "~/types/resource/tokioResource";
import type { TokioResourceStats } from "~/types/resource/tokioResourceStats";
import { Timestamp } from "~/types/common/duration";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";

describe("TokioResource", () => {
    let resource: TokioResource;
    let stats: TokioResourceStats;
    let timestamp: Timestamp;

    beforeEach(() => {
        stats = {
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
        timestamp = new Timestamp(1000n, 0);
        resource = new TokioResource(
            1n,
            1n,
            "parent",
            "parentId",
            1n,
            "kind",
            stats,
            "target",
            "concreteType",
            "location",
            Visibility.Public,
        );
    });

    test("totalDuration", () => {
        const duration = resource.totalDuration(timestamp);
        expect(duration.seconds).toBe(1000n);
        expect(duration.nanos).toBe(0);
    });

    test("isDropped", () => {
        const isDropped = resource.isDropped();
        expect(isDropped).toBe(true);
    });
});
