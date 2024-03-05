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

export async function watchForUpdates(pending: Ref<boolean>) {
    if (state.isUpdateWatched) {
        pending.value = false;
        return;
    }

    try {
        await backOff(
            async () => {
                const client = await useGrpcClient();
                const updateStream = client.watchUpdates(
                    new InstrumentRequest(),
                );

                for await (const value of updateStream) {
                    if (pending.value) {
                        pending.value = false;
                        state.isUpdateWatched = true;
                    }
                    updateLastUpdatedAt(value);
                    addMetadata(value);
                    addTasks(value);
                    retainTasks(state.retainFor);
                    addResources(value);
                    retainResources(state.retainFor);
                    addAsyncOps(value);
                    retainAsyncOps(state.retainFor);
                }
            },
            {
                retry: () => {
                    // Set pending to true to display a loading indicator until reconnection.
                    if (!pending.value) {
                        pending.value = true;
                    }
                    return true;
                },
            },
        );
    } catch (err) {
        handleConnectError(err);
    } finally {
        pending.value = false;
    }
}
