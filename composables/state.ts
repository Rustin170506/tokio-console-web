import { TokioTask } from "~/types/task/tokioTask";
import { Duration, Timestamp } from "~/types/task/duration";
import { Metadata } from "~/gen/common_pb";
import { type Update } from "~/gen/instrument_pb";

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

    // Whether the task update stream has been started.
    isConnected: boolean;
    updateStreamInstance?: AsyncIterable<Update>;
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
    isConnected: false,
};
