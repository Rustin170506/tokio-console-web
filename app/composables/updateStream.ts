import { ConnectError } from "@connectrpc/connect";
import { backOff } from "exponential-backoff";
import { state } from "./state";
import { InstrumentRequest, Update } from "~/gen/instrument_pb";
import { Timestamp } from "~/types/common/duration";
import { fromProtoMetadata } from "~/types/common/metadata";

export function handleConnectError(err: any) {
    const toast = useToast();

    if (err instanceof ConnectError) {
        toast.add({
            icon: "i-heroicons-x-circle",
            title: err.name,
            description: err.rawMessage,
            // Don't close the toast automatically.
            timeout: 0,
            color: "red",
        });
    }
}

const updateLastUpdatedAt = (update: Update) => {
    if (update.now !== undefined) {
        state.lastUpdatedAt.value = new Timestamp(
            update.now.seconds,
            update.now.nanos,
        );
    }
};

const addMetadata = (update: Update) => {
    if (update.newMetadata) {
        update.newMetadata.metadata.forEach((meta) => {
            const id = meta.id?.id;
            if (id && meta.metadata) {
                const metadata = fromProtoMetadata(meta.metadata, id);
                state.metas.set(id, metadata);
            }
        });
    }
};

/**
 *  Watch for updates from the server and update the state.
 * @param pending - A ref to indicate if the request is pending.
 */
export async function watchForUpdates() {
    const {
        isWatchStarted,
        metas,
        lastUpdatedAt,
        retainFor,
        taskState,
        asyncOpsState,
        resourceState,
    } = state;
    if (isWatchStarted) {
        return;
    }
    state.isWatchStarted = true;

    try {
        await backOff(
            async () => {
                const client = useGrpcClient();
                const updateStream = client.watchUpdates(
                    new InstrumentRequest(),
                );

                for await (const value of updateStream) {
                    if (state.isUpdatePending.value) {
                        state.isUpdatePending.value = false;
                    }
                    updateLastUpdatedAt(value);
                    addMetadata(value);
                    taskState.addTasks(value, metas);
                    taskState.retainTasks(retainFor.value, lastUpdatedAt);
                    resourceState.addResources(value, metas);
                    resourceState.retainResources(
                        retainFor.value,
                        lastUpdatedAt,
                    );
                    asyncOpsState.addAsyncOps(
                        value,
                        metas,
                        taskState,
                        resourceState,
                    );
                    asyncOpsState.retainAsyncOps(
                        retainFor.value,
                        lastUpdatedAt,
                    );
                }
            },
            {
                retry: () => {
                    state.isUpdatePending.value = true;
                    return true;
                },
            },
        );
    } catch (err) {
        handleConnectError(err);
    } finally {
        state.isWatchStarted = false;
    }
}
