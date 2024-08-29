<template>
    <UChip
        v-if="totalWarningsCount > 0"
        inset
        color="yellow"
        position="bottom-right"
    >
        <UButton
            :icon="'i-heroicons-exclamation-triangle-20-solid'"
            color="gray"
            variant="ghost"
            aria-label="Warnings"
            @click="openSlideover"
        />
    </UChip>
    <UButton
        v-else
        :icon="'i-heroicons-exclamation-triangle-20-solid'"
        color="gray"
        variant="ghost"
        aria-label="Warnings"
        @click="openSlideover"
    />
</template>

<script setup lang="ts">
import WarningsSlideover from "./WarningsSlideover.vue";

const slideover = useSlideover();
const { totalWarningsCount } = useWarnings();

function openSlideover() {
    slideover.open(WarningsSlideover);
}
</script>
