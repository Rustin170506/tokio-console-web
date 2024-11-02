import { getCurrentScope, onScopeDispose, ref } from "vue";

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
