<template>
    <div id="console-menu" ref="menuEl" :style="[menuStyle, vars]">
        <div v-if="!isSafari" class="console-glowing" />
        <div
            ref="panelEl"
            class="console-panel"
            :style="{
                display: 'flex',
            }"
        >
            <NuxtLink to="/">
                <button
                    class="console-icon-button m-4"
                    :class="{
                        'text-blue-500 dark:text-blue-500': isTasksRoute,
                    }"
                    title="Tasks"
                >
                    Tasks
                </button>
            </NuxtLink>
            <div class="flex">
                <PlayPauseButton />
            </div>
            <NuxtLink to="/resources">
                <button
                    class="console-icon-button m-2"
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
import { useEventListener, useScreenSafeArea } from "~/utils";

const route = useRoute();
const isTasksRoute = computed(() => route.path === "/");
const isResourcesRoute = computed(() => route.path === "/resources");

export interface MenuState {
    left: number;
}

const state: MenuState = {
    left: 50,
};

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
const menuEl = ref<HTMLDivElement>();

const windowSize = reactive({ width: 0, height: 0 });

onMounted(() => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;

    useEventListener(window, "resize", () => {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
    });
});

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

const menuPos = computed(() => {
    const halfWidth = (panelEl.value?.clientWidth || 0) / 2;
    const halfHeight = (panelEl.value?.clientHeight || 0) / 2;
    const left = (state.left * windowSize.width) / 100;

    return {
        left: clamp(
            left,
            halfWidth + panelMargins.left,
            windowSize.width - halfWidth - panelMargins.right,
        ),
        top: panelMargins.top + halfHeight,
    };
});

const menuStyle = computed(() => {
    return {
        left: `${menuPos.value.left}px`,
        top: `${menuPos.value.top}px`,
        pointerEvents: "auto",
    } as const;
});
</script>

<style scoped>
#console-menu {
    width: 0;
    z-index: 49;
    position: fixed;
    transform-origin: center center;
    transform: translate(-50%, -50%) rotate(0);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 15px !important;
    box-sizing: border-box;
}

#console-menu * {
    box-sizing: border-box;
}

#console-menu .console-panel {
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

#console-menu .console-icon-button {
    border-radius: 100%;
    border-width: 0;
    height: 30px;
}

#console-menu .console-icon-button:hover {
    opacity: 1;
    color: #007bff;
}

#console-menu:hover .console-glowing {
    opacity: 0.6;
}

#console-menu .console-glowing {
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
