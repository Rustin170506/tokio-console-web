<template>
    <div>
        <NuxtWelcome />
    </div>
</template>

<script setup>
import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Instrument } from "./gen/instrument_connect";
import { InstrumentRequest } from "./gen/instrument_pb";

const config = useRuntimeConfig();

const transport = createGrpcWebTransport({
    baseUrl: config.public.SUBSCRIBER_BASE_URL,
});

const client = createPromiseClient(Instrument, transport);
const stream = client.watchUpdates(new InstrumentRequest());
(async () => {
    for await (const value of stream) {
        console.log(value);
    }
})();
</script>
