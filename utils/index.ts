import type { Ref } from "vue";
import { getCurrentScope, onScopeDispose, ref, watch } from "vue";

export function useObjectStorage<T>(
    key: string,
    initial: T,
    listenToStorage = true,
): Ref<T> {
    const raw = localStorage.getItem(key);
    const data = ref(raw ? JSON.parse(raw) : initial);

    for (const key in initial) {
        if (data.value[key] === undefined) data.value[key] = initial[key];
    }

    let updating = false;
    let wrote = "";

    watch(
        data,
        (value) => {
            if (updating) return;
            wrote = JSON.stringify(value);
            localStorage.setItem(key, wrote);
        },
        { deep: true, flush: "post" },
    );

    if (listenToStorage) {
        useEventListener(window, "storage", (e: StorageEvent) => {
            if (e.key === key && e.newValue && e.newValue !== wrote) {
                updating = true;
                data.value = JSON.parse(e.newValue);
                updating = false;
            }
        });
    }

    return data;
}

export function useEventListener(
    target: EventTarget,
    type: string,
    listener: any,
    options?: boolean | AddEventListenerOptions,
) {
    target.addEventListener(type, listener, options);
    getCurrentScope() &&
        onScopeDispose(() =>
            target.removeEventListener(type, listener, options),
        );
}

const topVarName = "--console-safe-area-top";
const rightVarName = "--console-safe-area-right";
const bottomVarName = "--console-safe-area-bottom";
const leftVarName = "--console-safe-area-left";

/**
 * Reactive `env(safe-area-inset-*)`
 *
 * @see https://vueuse.org/useScreenSafeArea
 */
export function useScreenSafeArea() {
    const top = ref(0);
    const right = ref(0);
    const bottom = ref(0);
    const left = ref(0);

    document.documentElement.style.setProperty(
        topVarName,
        "env(safe-area-inset-top, 0px)",
    );
    document.documentElement.style.setProperty(
        rightVarName,
        "env(safe-area-inset-right, 0px)",
    );
    document.documentElement.style.setProperty(
        bottomVarName,
        "env(safe-area-inset-bottom, 0px)",
    );
    document.documentElement.style.setProperty(
        leftVarName,
        "env(safe-area-inset-left, 0px)",
    );

    update();
    useEventListener(window, "resize", update);

    function getValue(position: string) {
        return (
            Number.parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue(
                    position,
                ),
            ) || 0
        );
    }

    function update() {
        top.value = getValue(topVarName);
        right.value = getValue(rightVarName);
        bottom.value = getValue(bottomVarName);
        left.value = getValue(leftVarName);
    }

    return {
        top,
        right,
        bottom,
        left,
        update,
    };
}
