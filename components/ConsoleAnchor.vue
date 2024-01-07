<template>
    <div
        id="console-anchor"
        ref="anchorEl"
        :style="[anchorStyle, vars]"
        :class="{
            'console-vertical': isVertical,
        }"
    >
        <div
            v-if="!isSafari"
            class="console-glowing"
            :style="isDragging ? 'opacity: 0.6 !important' : ''"
        />
        <div
            ref="panelEl"
            class="console-panel"
            :style="{
                ...panelStyle,
                display: 'flex',
                justifyContent: 'space-around',
            }"
            @pointerdown="onPointerDown"
        >
            <NuxtLink to="/">
                <button
                    class="console-icon-button"
                    :class="{
                        'text-blue-500 dark:text-blue-500': isTasksRoute,
                    }"
                    title="Tasks"
                >
                    Tasks
                </button>
            </NuxtLink>
            <div
                class="border-l border-gray-300 dark:border-gray-700 w-px h-4 console-panel-content"
            />
            <NuxtLink to="/resources">
                <button
                    class="console-icon-button"
                    :class="{
                        'text-blue-500 dark:text-blue-500': isResourcesRoute,
                    }"
                    title="Resources"
                >
                    Resources
                </button>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useEventListener, useObjectStorage, useScreenSafeArea } from "~/utils";

const route = useRoute();
const isTasksRoute = computed(() => route.path === "/");
const isResourcesRoute = computed(() => route.path === "/resources");

export interface AnchorState {
    top: number;
    left: number;
    position: "left" | "right" | "bottom" | "top";
}

const state = useObjectStorage<AnchorState>(
    "console-state",
    {
        top: 0,
        left: 50,
        position: "bottom",
    },
    false,
);

const panelMargins = reactive({
    left: 10,
    top: 10,
    right: 10,
    bottom: 10,
});

const safeArea = useScreenSafeArea();

const isSafari =
    navigator.userAgent.includes("Safari") &&
    !navigator.userAgent.includes("Chrome");

watchEffect(() => {
    panelMargins.left = safeArea.left.value + 10;
    panelMargins.top = safeArea.top.value + 10;
    panelMargins.right = safeArea.right.value + 10;
    panelMargins.bottom = safeArea.bottom.value + 10;
});

const SNAP_THRESHOLD = 2;

const vars = computed(() => {
    const colorMode = useColorMode();
    const dark = colorMode.value === "dark";
    return {
        "--console-widget-bg": dark ? "#111" : "#ffffff",
        "--console-widget-fg": dark ? "#F5F5F5" : "#111",
        "--console-widget-border": dark ? "#3336" : "#efefef",
        "--console-widget-shadow": dark
            ? "rgba(0,0,0,0.3)"
            : "rgba(128,128,128,0.1)",
    };
});

const panelEl = ref<HTMLDivElement>();
const anchorEl = ref<HTMLDivElement>();

const windowSize = reactive({ width: 0, height: 0 });
const isDragging = ref(false);
const draggingOffset = reactive({ x: 0, y: 0 });
const mousePosition = reactive({ x: 0, y: 0 });

function onPointerDown(e: PointerEvent) {
    if (!panelEl.value) return;
    isDragging.value = true;
    const { left, top, width, height } = panelEl.value!.getBoundingClientRect();
    draggingOffset.x = e.clientX - left - width / 2;
    draggingOffset.y = e.clientY - top - height / 2;
}

onMounted(() => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;

    useEventListener(window, "resize", () => {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
    });

    useEventListener(window, "pointermove", (e: PointerEvent) => {
        if (!isDragging.value) return;

        const centerX = windowSize.width / 2;
        const centerY = windowSize.height / 2;

        const x = e.clientX - draggingOffset.x;
        const y = e.clientY - draggingOffset.y;

        mousePosition.x = x;
        mousePosition.y = y;

        // Get position
        const deg = Math.atan2(y - centerY, x - centerX);
        const HORIZONTAL_MARGIN = 70;
        const TL = Math.atan2(0 - centerY + HORIZONTAL_MARGIN, 0 - centerX);
        const TR = Math.atan2(
            0 - centerY + HORIZONTAL_MARGIN,
            windowSize.width - centerX,
        );
        const BL = Math.atan2(
            windowSize.height - HORIZONTAL_MARGIN - centerY,
            0 - centerX,
        );
        const BR = Math.atan2(
            windowSize.height - HORIZONTAL_MARGIN - centerY,
            windowSize.width - centerX,
        );

        state.value.position =
            deg >= TL && deg <= TR
                ? "top"
                : deg >= TR && deg <= BR
                  ? "right"
                  : deg >= BR && deg <= BL
                    ? "bottom"
                    : "left";

        state.value.left = snapToPoints((x / windowSize.width) * 100);
        state.value.top = snapToPoints((y / windowSize.height) * 100);
    });
    useEventListener(window, "pointerup", () => {
        isDragging.value = false;
    });
    useEventListener(window, "pointerleave", () => {
        isDragging.value = false;
    });
});

function snapToPoints(value: number) {
    if (value < 5) return 0;
    if (value > 95) return 100;
    if (Math.abs(value - 50) < SNAP_THRESHOLD) return 50;
    return value;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

const isVertical = computed(
    () => state.value.position === "left" || state.value.position === "right",
);

const anchorPos = computed(() => {
    const halfWidth = (panelEl.value?.clientWidth || 0) / 2;
    const halfHeight = (panelEl.value?.clientHeight || 0) / 2;

    const left = (state.value.left * windowSize.width) / 100;
    const top = (state.value.top * windowSize.height) / 100;

    switch (state.value.position) {
        case "top":
            return {
                left: clamp(
                    left,
                    halfWidth + panelMargins.left,
                    windowSize.width - halfWidth - panelMargins.right,
                ),
                top: panelMargins.top + halfHeight,
            };
        case "right":
            return {
                left: windowSize.width - panelMargins.right - halfHeight,
                top: clamp(
                    top,
                    halfWidth + panelMargins.top,
                    windowSize.height - halfWidth - panelMargins.bottom,
                ),
            };
        case "left":
            return {
                left: panelMargins.left + halfHeight,
                top: clamp(
                    top,
                    halfWidth + panelMargins.top,
                    windowSize.height - halfWidth - panelMargins.bottom,
                ),
            };
        case "bottom":
        default:
            return {
                left: clamp(
                    left,
                    halfWidth + panelMargins.left,
                    windowSize.width - halfWidth - panelMargins.right,
                ),
                top: windowSize.height - panelMargins.bottom - halfHeight,
            };
    }
});

const anchorStyle = computed(() => {
    return {
        left: `${anchorPos.value.left}px`,
        top: `${anchorPos.value.top}px`,
        pointerEvents: "auto",
    } as const;
});

const panelStyle = computed(() => {
    const style: any = {
        transform: isVertical.value
            ? `translate(-50%, -50%) rotate(90deg)`
            : `translate(-50%, -50%)`,
    };
    if (isDragging.value) style.transition = "none !important";
    return style;
});
</script>

<style scoped>
#console-anchor {
    width: 0;
    z-index: 2147483645;
    position: fixed;
    transform-origin: center center;
    transform: translate(-50%, -50%) rotate(0);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 15px !important;
    box-sizing: border-box;
}

#console-anchor * {
    box-sizing: border-box;
}

#console-anchor .console-panel {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 2px;
    height: 40px;
    padding: 2px 2px 2px 2.5px;
    border: 1px solid var(--console-widget-border);
    border-radius: 100px;
    background-color: var(--console-widget-bg);
    backdrop-filter: blur(10px);
    color: var(--console-widget-fg);
    box-shadow: 2px 2px 8px var(--console-widget-shadow);
    user-select: none;
    touch-action: none;
    max-width: 250px;
    transition:
        all 0.6s ease,
        max-width 0.6s ease,
        padding 0.5s ease,
        transform 0.4s ease,
        opacity 0.2s ease;
}

#console-anchor.console-vertical .console-panel {
    transform: translate(-50%, -50%) rotate(90deg);
    box-shadow: 2px -2px 8px var(--console-widget-shadow);
}

#console-anchor .console-panel-content {
    transition: opacity 0.4s ease;
}

#console-anchor .console-icon-button {
    border-radius: 100%;
    border-width: 0;
    height: 30px;
    width: 120px;
}

#console-anchor .console-icon-button:hover {
    opacity: 1;
    color: #007bff;
}

#console-anchor:hover .console-glowing {
    opacity: 0.6;
}

#console-anchor .console-glowing {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    width: 160px;
    height: 160px;
    opacity: 0;
    transition: all 1s ease;
    pointer-events: none;
    z-index: -1;
    border-radius: 9999px;
    background-image: linear-gradient(45deg, #00dc82, #36e4da, #0047e1);
    filter: blur(60px);
}
</style>
