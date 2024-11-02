import { describe, test, expect } from "vitest";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";
import type { Metadata } from "~/types/common/metadata";
import { Timestamp, Duration } from "~/types/common/duration";
import { Stats as ProtoAsyncOpStats } from "~/gen/async_ops_pb";
import { Ids } from "~/composables/state";
import {
    fromProtoAsyncOpStats,
    type AsyncOpStats,
} from "~/types/asyncOp/asyncOpStats";

describe("AsyncOpStats", () => {
    test("fromProtoAsyncOpStats", () => {
        const protoStats = new ProtoAsyncOpStats({
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
            pollStats: {
                polls: 10n,
                busyTime: { seconds: 500n, nanos: 0 },
                lastPollStarted: { seconds: 1500n, nanos: 500 },
                lastPollEnded: { seconds: 2000n, nanos: 500 },
            },
            taskId: { id: 1n },
        });

        const metadata: Metadata = {
            id: 1n,
            target: "tokio::task",
            fieldNames: ["name"],
        };

        const taskIds = new Ids();

        const expected: AsyncOpStats = {
            createdAt: new Timestamp(1000n, 500),
            droppedAt: new Timestamp(2000n, 500),
            total: new Duration(1000n, 0),
            busy: new Duration(500n, 0),
            idle: new Duration(500n, 0),
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
            lastPollStarted: new Duration(1500n, 500),
            lastPollEnded: new Timestamp(2000n, 500),
        };

        const result = fromProtoAsyncOpStats(protoStats, metadata, taskIds);
        expect(result).toEqual(expected);
    });
});
