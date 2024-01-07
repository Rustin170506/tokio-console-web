import { ConnectError } from "@connectrpc/connect";
import { state } from "./state";
import { InstrumentRequest, Update } from "~/gen/instrument_pb";
import { Timestamp } from "~/types/common/duration";
import { fromProtoMetadata } from "~/types/common/metadata";

export function handleConnectError(err: any) {
    const toast = useToast();

    if (err instanceof ConnectError) {
        toast.add({
            title: err.name,
            description: err.rawMessage,
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
        const client = useGrpcClient();
        const updateStream = client.watchUpdates(new InstrumentRequest());

        for await (const value of updateStream) {
            if (pending.value) {
                pending.value = false;
            }
            updateLastUpdatedAt(value);
            addMetadata(value);
            addTasks(value);
            retainTasks(state.retainFor);
            addResources(value);
            retainResources(state.retainFor);
        }

        state.isUpdateWatched = true;
    } catch (err) {
        handleConnectError(err);
    } finally {
        pending.value = false;
    }
}
