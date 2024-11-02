<template>
    <UPopover
        v-if="shouldShowPopover"
        mode="hover"
        :content="firstAttribute.value.value"
    >
        ...
        <template #panel>
            <div
                v-for="(attribute, index) in attributes"
                :key="index"
                class="m-2"
            >
                <p>
                    <span :class="attribute.name.class">{{
                        attribute.name.value
                    }}</span>
                    <span class="text-gray-500 dark:text-gray-400">=</span>
                    <span :class="attribute.value.class">{{
                        attribute.value.value
                    }}</span>
                    <span :class="attribute.unit.class">{{
                        attribute.unit.value
                    }}</span>
                </p>
            </div>
        </template>
    </UPopover>
    <div v-else class="mb-1">
        <p>
            <span :class="firstAttribute.name.class">{{
                firstAttribute.name.value
            }}</span>
            <span class="text-gray-500 dark:text-gray-400">=</span>
            <span :class="firstAttribute.value.class">{{
                firstAttribute.value.value
            }}</span>
            <span :class="firstAttribute.unit.class">{{
                firstAttribute.unit.value
            }}</span>
        </p>
    </div>
</template>

<script setup>
const props = defineProps({
    attributes: {
        type: Array,
        required: true,
    },
});

const firstAttribute = computed(() => props.attributes[0]);
const shouldShowPopover = computed(
    () =>
        props.attributes.length > 1 ||
        (firstAttribute.value && firstAttribute.value.value.value.length > 20),
);
</script>
