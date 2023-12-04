<template>
    <div>
        <NuxtWelcome />
    </div>
</template>

<script setup>
import { InstrumentRequest } from "./gen/instrument_pb";

const client = useGrpcClient();

const stream = client.watchUpdates(new InstrumentRequest());
(async () => {
    for await (const value of stream) {
        console.log(value);
    }
})();
</script>
