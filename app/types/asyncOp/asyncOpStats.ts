import { Timestamp, Duration } from "../common/duration";
import { Field } from "../common/field";
import type { Metadata } from "../common/metadata";
import type { Attribute } from "../resource/tokioResourceStats";
import type { Stats as ProtoAsyncOpStats } from "~/gen/async_ops_pb";
import { Ids } from "~/composables/state";

export interface AsyncOpStats {
    createdAt: Timestamp;
    droppedAt?: Timestamp;

    polls: bigint;
    busy: Duration;
    lastPollStarted?: Duration;
    lastPollEnded?: Timestamp;
    idle?: Duration;
    total?: Duration;
    taskId?: bigint;
    taskIdStr: string;
    attributes: Array<Attribute>;
}

export function fromProtoAsyncOpStats(
    stats: ProtoAsyncOpStats,
    meta: Metadata,
    taskIds: Ids,
): AsyncOpStats {
    const attributes: Array<Attribute> = stats.attributes.reduce((acc, a) => {
        if (a.field === undefined) {
            return acc;
        }
        const field = Field.fromProto(a.field, meta);
        if (field === undefined) {
            return acc;
        }
        const unit = a.unit;
        acc.push({ field, unit });
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

    const pollStats = stats.pollStats!;
    const busy = new Duration(
        pollStats.busyTime?.seconds ?? 0n,
        pollStats.busyTime?.nanos ?? 0,
    );
    const idle = total?.subtract(busy);
    const taskId = stats.taskId ? taskIds.idFor(stats.taskId.id) : undefined;
    const taskIdStr = taskId?.toString() ?? "N/A";

    return {
        createdAt,
        droppedAt,
        total,
        busy,
        idle,
        taskId,
        taskIdStr,
        attributes,
        polls: pollStats.polls,
        lastPollStarted: pollStats.lastPollStarted
            ? new Duration(
                  pollStats.lastPollStarted.seconds,
                  pollStats.lastPollStarted.nanos,
              )
            : undefined,
        lastPollEnded: pollStats.lastPollEnded
            ? new Timestamp(
                  pollStats.lastPollEnded.seconds,
                  pollStats.lastPollEnded.nanos,
              )
            : undefined,
    };
}
