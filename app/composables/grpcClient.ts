import { createPromiseClient, type PromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "~/gen/instrument_connect";

let client: PromiseClient<typeof Instrument> | null = null;

export async function useGrpcClient() {
    // Retrieve the subscriber.json file to obtain the subscriberBaseUrl.
    // This is a temporary solution for setting the base URL in the command line interface.
    // The nuxt build process will place `subscriber.json` in the root directory of the output.
    const res = await fetch("/subscriber.json");
    const config = await res.json();
    const transport = createGrpcWebTransport({
        baseUrl: config.targetAddr,
    });

    if (!client) {
        client = createPromiseClient(Instrument, transport);
    }

    return client;
}
