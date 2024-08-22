import { toTaskWarningItems, type WarningItem } from "~/types/warningItem";

/**
 * useWarnings is a composable function that returns the warnings.
 * If the warnings are not updated, it will watch for updates.
 * @returns The warnings and the warnings count.
 */
export function useWarnings() {
    const { tasksData, lastUpdatedAt } = useTasks();

    const warnings = computed(() => {
        const lastUpdated = lastUpdatedAt.value;
        if (!lastUpdated) {
            return [];
        }
        return Array.from(tasksData.value.values()).reduce((acc, task) => {
            const taskWarningItems = toTaskWarningItems(task.warnings);
            if (taskWarningItems) {
                acc.push(...taskWarningItems);
            }
            return acc;
        }, [] as WarningItem[]);
    });

    const warningsCount = computed(() => warnings.value.length);

    return {
        warnings,
        warningsCount,
    };
}
