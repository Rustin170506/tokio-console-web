import { TokioTask } from "~/types/task/tokioTask";
import { Duration, Timestamp } from "~/types/common/duration";
import type { Metadata } from "~/types/common/metadata";
import type { TokioResource } from "~/types/resource/tokioResource";
import type { AsyncOp } from "~/types/asyncOp/asyncOp";

export class Store<T> {
    items: Ref<Map<bigint, T>>;
    ids: {
        nextId: bigint;
        map: Map<bigint, bigint>;
    };

    constructor() {
        this.items = ref<Map<bigint, T>>(new Map());
        this.ids = {
            nextId: 1n,
            map: new Map(),
        };
    }

    idFor(spanId: bigint): bigint {
        let id = this.ids.map.get(spanId);
        if (!id) {
            id = this.ids.nextId++;
            this.ids.map.set(spanId, id);
        }
        return id;
    }

    getBySpanId(spanId: bigint): T | undefined {
        const id = this.ids.map.get(spanId);
        return this.items.value.get(id!);
    }
}

export interface State {
    // Metadata about a task.
    metas: Map<bigint, Metadata>;
    // How long to retain tasks after they're dropped.
    retainFor: Duration;
    tasks: Store<TokioTask>;
    resources: Store<TokioResource>;
    asyncOps: Store<AsyncOp>;
    lastUpdatedAt: Ref<Timestamp | undefined>;

    isUpdateWatched: boolean;
}

export const state: State = {
    metas: new Map(),
    // TODO: make this configurable.
    retainFor: new Duration(6n, 0),
    tasks: new Store(),
    resources: new Store(),
    asyncOps: new Store(),
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isUpdateWatched: false,
};
