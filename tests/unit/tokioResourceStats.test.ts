import { describe, test, expect } from "vitest";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";
import type { Metadata } from "~/types/common/metadata";
import { Timestamp, Duration } from "~/types/common/duration";
import { Stats as ProtoResourceStats } from "~/gen/resources_pb";
import {
    fromProtoResourceStats,
    type TokioResourceStats,
} from "~/types/resource/tokioResourceStats";

describe("TokioResourceStats", () => {
    test("fromProtoResourceStats", () => {
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

        const expected: TokioResourceStats = {
            createdAt: new Timestamp(1000n, 500),
            droppedAt: new Timestamp(2000n, 500),
            total: new Duration(1000n, 0),
            attributes: [
                {
                    field: new Field(
                        "name",
                        new FieldValue(FieldValueType.Str, "test"),
                    ),
                    unit: "10ms",
                },
            ],
        };

        const result = fromProtoResourceStats(protoStats, metadata);
        expect(result).toEqual(expected);
    });
});
