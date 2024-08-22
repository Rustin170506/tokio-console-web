<template>
    <CHeader>
        <template #left>
            <NuxtLink to="/">
                <TokioLogo />
            </NuxtLink>
        </template>

        <template #right>
            <WarningsButton />
            <UButton
                color="gray"
                variant="ghost"
                to="https://github.com/hi-rustin/tokio-console-web"
                target="_blank"
                size="lg"
                icon="i-simple-icons-github"
                aria-label="GitHub"
            />
            <UButton
                color="gray"
                variant="ghost"
                to="https://discord.gg/EeF3cQw"
                target="_blank"
                size="lg"
                icon="i-simple-icons-discord"
                aria-label="GitHub"
            />
            <CColorMode />
            <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-cog-6-tooth"
                aria-label="Settings"
            />
        </template>
    </CHeader>
</template>

<script>
import CHeader from "./CHeader.vue";

export default {
    components: {
        CHeader,
    },
};
</script>
