/**
 * useAsyncOps is a composable function that returns the async ops.
 * If the async ops are not updated, it will watch for updates.
 * @returns The async ops and the last updated at timestamp.
 */
export function useAsyncOps() {
    const { isUpdateWatched, asyncOpsState, lastUpdatedAt } = state;
    const pending = ref<boolean>(!isUpdateWatched);

    if (!isUpdateWatched) {
        // Async function to watch for updates.
        watchForUpdates(pending);
    }

    return {
        pending,
        asyncOpsData: asyncOpsState.asyncOps.items,
        lastUpdatedAt,
    };
}
