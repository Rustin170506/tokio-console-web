/**
 * Get the resources from the state or if the state is not updated, watch for updates.
 * @returns The resources data and the last updated time.
 */
export function useResources() {
    const { isUpdatePending, resourceState, lastUpdatedAt, isWatchStarted } =
        state;
    const pending = isUpdatePending;
    // Async function to watch for updates.
    if (!isWatchStarted) {
        watchForUpdates();
    }

    return {
        pending,
        resourcesData: resourceState.resources.items,
        lastUpdatedAt,
    };
}

/**
 * Get the resource details from the state.
 * If the resource is not found, it will return undefined.
 * @param id - The id of the resource.
 * @returns The resource details and the last updated time.
 */
export function useResourceDetails(id: bigint) {
    const { resourceState, lastUpdatedAt } = state;
    const resource = resourceState.resources.getById(id);

    return {
        resource,
        lastUpdatedAt,
    };
}
