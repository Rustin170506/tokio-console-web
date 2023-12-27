import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: false,
    runtimeConfig: {
        public: {
            SUBSCRIBER_BASE_URL: process.env.SUBSCRIBER_BASE_URL,
        },
    },
    modules: ["@nuxt/ui", "nuxt-vitest"],
    ui: {
        icons: ["simple-icons"],
    },
    vite: {
        plugins: [wasm(), topLevelAwait()],
    },
});
