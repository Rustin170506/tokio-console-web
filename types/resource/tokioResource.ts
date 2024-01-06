import type { TokioResourceStats } from "./tokioResourceStats";

enum Visibility {
    Public,
    Private,
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
}
