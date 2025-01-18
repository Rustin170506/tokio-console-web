import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: false,
    modules: ["@nuxt/ui", "@vueuse/nuxt", "@pinia/nuxt"],
    vite: {
        plugins: [wasm(), topLevelAwait()],
        esbuild: {
            supported: {
                "top-level-await": true,
            },
        },
    },
    typescript: {
        typeCheck: true,
    },
    compatibilityDate: "2024-11-02",
});
