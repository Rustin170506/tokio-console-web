import { toWarningStats, type WarningStatItem } from "~/types/warningItem";

/**
 * useWarnings is a composable function that returns the warning statistics.
 * @returns The warning statistics and the total warnings count.
 */
export function useWarnings() {
    const { tasksData, lastUpdatedAt } = useTasks();

    const warningStats = computed<WarningStatItem[]>(() => {
        const lastUpdated = lastUpdatedAt.value;
        if (!lastUpdated) {
            return [];
        }
        const allWarnings = Array.from(tasksData.value.values()).flatMap(
            (task) => task.warnings,
        );
        return toWarningStats(allWarnings);
    });

    const totalWarningsCount = computed(() =>
        warningStats.value.reduce((sum, stat) => sum + stat.count, 0),
    );

    return {
        warningStats,
        totalWarningsCount,
    };
}
