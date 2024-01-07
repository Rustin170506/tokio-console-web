/* eslint-disable camelcase */
import type { Duration, Timestamp } from "../common/duration";
import type { TokioResourceStats } from "./tokioResourceStats";
import { Resource_Kind, Resource_Kind_Known } from "~/gen/resources_pb";

export enum Visibility {
    Public,
    Internal,
}

export class TokioResource {
    // The task's pretty (console-generated, sequential) task ID.
    //
    // This is NOT the `tracing::span::Id` for the task's tracing span on the
    // remote.
    id: bigint;
    // The `tracing::span::Id` on the remote process for this task's span.
    //
    // This is used when requesting a task details stream
    spanId: bigint;
    parent: string;
    parentId: string;
    metaId: bigint;
    kind: string;
    stats: TokioResourceStats;
    target: string;
    concreteType: string;
    location: string;
    visibility: Visibility;

    constructor(
        id: bigint,
        spanId: bigint,
        parent: string,
        parentId: string,
        metaId: bigint,
        kind: string,
        stats: TokioResourceStats,
        target: string,
        concreteType: string,
        location: string,
        visibility: Visibility,
    ) {
        this.id = id;
        this.spanId = spanId;
        this.parent = parent;
        this.parentId = parentId;
        this.metaId = metaId;
        this.kind = kind;
        this.stats = stats;
        this.target = target;
        this.concreteType = concreteType;
        this.location = location;
        this.visibility = visibility;
    }

    totalDuration(since: Timestamp): Duration {
        const duration = since.subtract(this.stats.createdAt);
        return this.stats.total ?? duration;
    }

    isDropped(): boolean {
        return this.stats.total !== undefined;
    }
}

export function kindFromProto(pb: Resource_Kind): string {
    if (!pb.kind) {
        throw new Error("a resource should have a kind field");
    }

    switch (pb.kind.case) {
        case "known":
            if (pb.kind.value === Resource_Kind_Known.TIMER) {
                return "Timer";
            } else {
                throw new Error(`failed to parse known kind from ${pb.kind}`);
            }
        case "other":
            return pb.kind.value;
        default:
            throw new Error(`Unknown kind: ${pb.kind}`);
    }
}
