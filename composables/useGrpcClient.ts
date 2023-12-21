import { createPromiseClient, type PromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "~/gen/instrument_connect";

let client: PromiseClient<typeof Instrument> | null = null;

export function useGrpcClient() {
    const config = useRuntimeConfig();
    const transport = createGrpcWebTransport({
        baseUrl: config.public.SUBSCRIBER_BASE_URL,
        // TODO: Make this configurable.
        defaultTimeoutMs: 60000, // 1 minute
    });

    if (!client) {
        client = createPromiseClient(Instrument, transport);
    }

    return client;
}
