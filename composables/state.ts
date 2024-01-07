import { TokioTask } from "~/types/task/tokioTask";
import { Duration, Timestamp } from "~/types/common/duration";
import type { Metadata } from "~/types/common/metadata";
import type { TokioResource } from "~/types/resource/tokioResource";

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
    // IDs for tasks.
    ids: {
        nextId: bigint;
        map: Map<bigint, bigint>;
    };
    // How long to retain tasks after they're dropped.
    retainFor: Duration;
    tasks: Ref<Map<bigint, TokioTask>>;
    resources: Store<TokioResource>;
    lastUpdatedAt: Ref<Timestamp | undefined>;

    isUpdateWatched: boolean;
}

export const state: State = {
    metas: new Map(),
    ids: {
        nextId: 1n,
        map: new Map(),
    },
    // TODO: make this configurable.
    retainFor: new Duration(6n, 0),
    tasks: ref<Map<bigint, TokioTask>>(new Map()),
    resources: new Store(),
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isUpdateWatched: false,
};
