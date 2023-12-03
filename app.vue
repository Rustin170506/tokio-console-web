<template>
    <div>
        <NuxtWelcome />
    </div>
</template>

<script>
import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "./gen/instrument_connect";
import { InstrumentRequest } from "./gen/instrument_pb";

const transport = createGrpcWebTransport({
    baseUrl: "http://127.0.0.1:8888",
});

const client = createPromiseClient(Instrument, transport);
const stream = client.watchUpdates(new InstrumentRequest());
(async () => {
    for await (const value of stream) {
        console.log(value);
    }
})();
</script>
