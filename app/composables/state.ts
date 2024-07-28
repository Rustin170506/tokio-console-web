import { TokioTask } from "~/types/task/tokioTask";
import { Duration, Timestamp } from "~/types/common/duration";
import type { Metadata } from "~/types/common/metadata";
import type { TokioResource } from "~/types/resource/tokioResource";
import type { AsyncOp } from "~/types/asyncOp/asyncOp";
import type { Warn } from "~/types/warning/warn";
import { NeverYielded } from "~/types/warning/neverYielded";

export class Ids {
    nextId: bigint;
    map: Map<bigint, bigint>;

    constructor() {
        this.nextId = 1n;
        this.map = new Map();
    }

    idFor(spanId: bigint): bigint {
        let id = this.map.get(spanId);
        if (!id) {
            id = this.nextId++;
            this.map.set(spanId, id);
        }
        return id;
    }
}

export class Store<T> {
    items: Ref<Map<bigint, T>>;
    ids: Ids;

    constructor() {
        this.items = ref(new Map());
        this.ids = new Ids();
    }

    idFor(spanId: bigint): bigint {
        return this.ids.idFor(spanId);
    }

    getBySpanId(spanId: bigint): T | undefined {
        const id = this.ids.map.get(spanId);
        return this.items.value.get(id!);
    }
}

// The state of tasks.
export interface TaskState {
    tasks: Store<TokioTask>;
    // The set of tasks that are pending linting.
    pendingLints: Set<bigint>;
    // The linters to run on tasks.
    linters: Array<Warn<TokioTask>>;
}

export interface State {
    // Metadata about a task.
    metas: Map<bigint, Metadata>;
    // How long to retain tasks after they're dropped.
    retainFor: Duration;
    taskState: TaskState;
    resources: Store<TokioResource>;
    asyncOps: Store<AsyncOp>;
    lastUpdatedAt: Ref<Timestamp | undefined>;
    isUpdateWatched: boolean;
}

export const state: State = {
    metas: new Map(),
    // TODO: make this configurable.
    retainFor: new Duration(6n, 0),
    taskState: {
        tasks: new Store(),
        pendingLints: new Set(),
        // TODO: make this configurable.
        linters: [new NeverYielded()],
    },
    resources: new Store(),
    asyncOps: new Store(),
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isUpdateWatched: false,
};
