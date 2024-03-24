<template>
    <UPopover
        v-if="shouldShowPopover"
        mode="hover"
        :content="firstField.value.value"
    >
        ...
        <template #panel>
            <div v-for="(field, index) in fields" :key="index" class="m-2">
                <p>
                    <span class="text-blue-600 dark:text-blue-400">{{
                        field.name
                    }}</span>
                    <span class="text-gray-500 dark:text-gray-400">=</span>
                    <span class="text-green-600 dark:text-green-400">{{
                        field.value.value
                    }}</span>
                </p>
            </div>
        </template>
    </UPopover>
    <div v-else class="mb-1">
        <p>
            <span class="text-blue-600 dark:text-blue-400">{{
                firstField.name
            }}</span>
            <span class="text-gray-500 dark:text-gray-400">=</span>
            <span class="text-green-600 dark:text-green-400">{{
                firstField.value.value
            }}</span>
        </p>
    </div>
</template>

<script setup>
const props = defineProps({
    fields: {
        type: Array,
        required: true,
    },
});

const firstField = computed(() => props.fields[0]);
const shouldShowPopover = computed(
    () =>
        props.fields.length > 1 ||
        (firstField.value && firstField.value.value.value.length > 12),
);
</script>
