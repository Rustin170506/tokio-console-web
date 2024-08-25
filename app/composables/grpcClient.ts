import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "~/gen/instrument_connect";
import { useSettingsStore } from "~/stores/settings";

/**
 * Create a gRPC client for the instrument service.
 * Cache the client to avoid creating multiple clients.
 */
export const useGrpcClient = useMemoize(() => {
    const nuxtApp = useNuxtApp();
    const settingsStore = useSettingsStore(nuxtApp.$pinia);

    if (!settingsStore.targetUrl) {
        settingsStore.openSettingsModal();
        throw new Error("Target URL is not set. Please configure in settings.");
    }

    const transport = createGrpcWebTransport({
        baseUrl: settingsStore.targetUrl,
    });
    return createPromiseClient(Instrument, transport);
});
