import { consola } from "consola";
import type { Update } from "~/gen/instrument_pb";
import type { ResourceUpdate } from "~/gen/resources_pb";
import type { Duration } from "~/types/common/duration";
import { formatLocation } from "~/types/common/field";
import {
    kindFromProto,
    TokioResource,
    Visibility,
} from "~/types/resource/tokioResource";
import { fromProtoResourceStats } from "~/types/resource/tokioResourceStats";

/**
 *  Convert the resource update from the server to resources.
 * @param update - The update from the server.
 * @returns The resources.
 */
const resourceUpdateToResources = (update: ResourceUpdate): TokioResource[] => {
    const result = new Array<TokioResource>();
    const { newResources: resources, statsUpdate } = update;

    // Get the parents of the resources.
    const parents: Map<bigint, TokioResource> = resources.reduce(
        (map, resource) => {
            const parentId = resource.parentResourceId?.id;
            if (parentId) {
                const parent = state.resources.getBySpanId(parentId);
                if (parent) {
                    map.set(parentId, parent);
                }
            }
            return map;
        },
        new Map<bigint, TokioResource>(),
    );

    for (const resource of resources) {
        if (!resource.id) {
            consola.warn("skipping resource with no id", resource);
            continue;
        }

        let metaId;
        if (resource.metadata) {
            metaId = resource.metadata.id;
        } else {
            consola.warn("resource has no metadata id, skipping", resource);
            continue;
        }

        const meta = state.metas.get(metaId);
        if (!meta) {
            consola.warn("no metadata for resource, skipping", resource);
            continue;
        }

        if (!resource.kind) {
            continue;
        }
        let kind;
        try {
            kind = kindFromProto(resource.kind);
        } catch (e) {
            consola.warn("resource kind cannot ve parsed", resource.kind, e);
            continue;
        }

        const spanId = resource.id.id;
        const stats = statsUpdate[spanId.toString()];
        if (!stats) {
            continue;
        }
        // Delete
        delete statsUpdate[spanId.toString()];
        const resourceStats = fromProtoResourceStats(stats, meta);

        const id = state.resources.idFor(spanId);
        let parentId = resource.parentResourceId?.id;
        let parentIdStr = "N/A";
        let parentStr = "N/A";
        if (parentId) {
            parentId = state.resources.idFor(parentId);
            parentIdStr = parentId.toString();
            const parent = parents.get(parentId);
            if (parent) {
                parentStr = `${parent.id} (${parent.target}::${parent.concreteType})`;
            }
        }

        const location = formatLocation(resource.location);
        let visibility;
        if (resource.isInternal) {
            visibility = Visibility.Internal;
        } else {
            visibility = Visibility.Public;
        }

        const r = new TokioResource(
            id,
            spanId,
            parentStr,
            parentIdStr,
            metaId,
            kind,
            resourceStats,
            meta.target,
            resource.concreteType,
            location,
            visibility,
        );
        result.push(r);
    }

    return result;
};

/**
 * Add resources to the state.
 * @param update - The update from the server.
 */
export function addResources(update: Update) {
    if (!update.resourceUpdate) return;
    const resources = resourceUpdateToResources(update.resourceUpdate);
    resources.forEach((resource) =>
        state.resources.items.value.set(resource.id, resource),
    );

    Object.entries(update.resourceUpdate.statsUpdate).forEach(
        ([spanId, statsUpdate]) => {
            const resource = state.resources.getBySpanId(BigInt(spanId));
            if (!resource) return;

            const meta = state.metas.get(resource.metaId);
            if (!meta) return;

            resource.stats = fromProtoResourceStats(statsUpdate, meta);
            state.resources.items.value.set(resource.id, resource);
        },
    );
}

/**
 * Retain the resources for the given duration.
 * This will remove the resources that are older than the given duration.
 * @param retainFor - The duration to retain the resources.
 */
export function retainResources(retainFor: Duration) {
    const newResources = new Map<bigint, TokioResource>();
    for (const [id, resource] of state.resources.items.value) {
        const shouldRetain =
            !resource.stats.droppedAt ||
            state.lastUpdatedAt.value
                ?.subtract(resource.stats.droppedAt)
                .greaterThan(retainFor) === false;
        if (shouldRetain) {
            newResources.set(id, resource);
        }
    }
    state.resources.items.value = newResources;
}

/**
 * Get the resources from the state or if the state is not updated, watch for updates.
 * @returns The resources data and the last updated time.
 */
export function useResources() {
    const pending = ref<boolean>(!state.isUpdateWatched);

    if (!state.isUpdateWatched) {
        // Async function to watch for updates.
        watchForUpdates(pending);
    }

    return {
        pending,
        resourcesData: state.resources.items,
        lastUpdatedAt: state.lastUpdatedAt,
    };
}

export function useResourceDetails(id: bigint) {
    const pending = ref<boolean>(true);
    const resource = state.resources.items.value.get(id);

    pending.value = false;
    return {
        pending,
        resource,
        lastUpdatedAt: state.lastUpdatedAt,
    };
}
