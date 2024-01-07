import { TokioTask } from "~/types/task/tokioTask";
import { Duration, Timestamp } from "~/types/common/duration";
import type { Metadata } from "~/types/common/metadata";

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
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isUpdateWatched: false,
};
