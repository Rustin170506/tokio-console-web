import path from "path";
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
    modules: ["@nuxt/ui"],
    ui: {
        icons: ["simple-icons"],
    },
    vite: {
        plugins: [wasm(), topLevelAwait()],
    },
    nitro: {
        output: {
            publicDir: path.resolve(__dirname, "public"),
        },
    },
});
