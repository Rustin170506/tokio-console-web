/**
 * useAsyncOps is a composable function that returns the async ops.
 * If the async ops are not updated, it will watch for updates.
 * @returns The async ops and the last updated at timestamp.
 */
export function useAsyncOps() {
    const { isUpdatePending, asyncOpsState, lastUpdatedAt, isWatchStarted } =
        state;
    const pending = isUpdatePending;
    // Async function to watch for updates.
    if (!isWatchStarted) {
        watchForUpdates();
    }

    return {
        pending,
        asyncOpsData: asyncOpsState.asyncOps.items,
        lastUpdatedAt,
    };
}
