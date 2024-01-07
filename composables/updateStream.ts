import { ConnectError } from "@connectrpc/connect";
import { state } from "./state";
import { InstrumentRequest } from "~/gen/instrument_pb";

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
            addTasks(value);
            retainTasks(state.retainFor);
        }

        state.isUpdateWatched = true;
    } catch (err) {
        handleConnectError(err);
    } finally {
        pending.value = false;
    }

    return pending;
}
