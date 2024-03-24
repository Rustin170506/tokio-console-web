import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "~/gen/instrument_connect";

/**
 * Create a gRPC client for the Instrument service.
 * Cache the client to avoid creating multiple clients.
 */
export const grpcClient = useMemoize(async () => {
    // Retrieve the subscriber.json file to obtain the subscriberBaseUrl.
    // This is a temporary solution for setting the base URL in the command line interface.
    // The nuxt build process will place `subscriber.json` in the root directory of the output.
    const res = await fetch("/subscriber.json");
    const config = await res.json();
    const transport = createGrpcWebTransport({
        baseUrl: config.targetAddr,
    });

    return createPromiseClient(Instrument, transport);
});
