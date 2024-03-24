<template>
    <UPopover v-if="shouldShowPopover" mode="hover" :content="location">
        <p>
            {{ displayText }}
        </p>
        <template #panel>
            <div class="m-2">
                {{ location }}
            </div>
        </template>
    </UPopover>
    <div v-else-if="location" class="mb-1">
        {{ location }}
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    location: {
        type: String,
        required: true,
    },
});

const shouldShowPopover = computed(
    () => props.location && props.location.length > 50,
);
const displayText = computed(() =>
    shouldShowPopover.value
        ? props.location.substring(0, 50) + "..."
        : props.location,
);
</script>
