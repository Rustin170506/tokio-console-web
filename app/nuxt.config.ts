import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: false,
    modules: ["@nuxt/ui", "@vueuse/nuxt", "@pinia/nuxt"],
    vite: {
        plugins: [wasm(), topLevelAwait()],
    },
    typescript: {
        typeCheck: true,
    },
});
