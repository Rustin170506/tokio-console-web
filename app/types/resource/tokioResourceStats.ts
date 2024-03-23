import { Field } from "../common/field";
import { Timestamp, type Duration } from "../common/duration";
import type { Metadata } from "../common/metadata";
import type { Stats as ProtoResourceStats } from "~/gen/resources_pb";

export interface Attribute {
    field: Field;
    unit?: string;
}
export interface TokioResourceStats {
    createdAt: Timestamp;
    droppedAt?: Timestamp;
    total?: Duration;
    attributes: Array<Attribute>;
}

export function fromProtoResourceStats(
    stats: ProtoResourceStats,
    meta: Metadata,
): TokioResourceStats {
    const attributes: Array<Attribute> = stats.attributes.reduce((acc, a) => {
        if (a.field !== undefined) {
            const field = Field.fromProto(a.field, meta);
            if (field !== undefined) {
                acc.push({ field, unit: a.unit });
            }
        }
        return acc;
    }, [] as Array<Attribute>);

    const createdAt = new Timestamp(
        stats.createdAt!.seconds,
        stats.createdAt!.nanos,
    );
    const droppedAt = stats.droppedAt
        ? new Timestamp(stats.droppedAt.seconds, stats.droppedAt.nanos)
        : undefined;
    const total = droppedAt?.subtract(createdAt);

    return {
        createdAt,
        droppedAt,
        total,
        attributes,
    };
}
