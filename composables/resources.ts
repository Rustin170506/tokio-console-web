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

const resourceUpdateToResources = (update: ResourceUpdate): TokioResource[] => {
    const result = new Array<TokioResource>();
    const resources = update.newResources;
    const statsUpdate = update.statsUpdate;
    const parents: Map<bigint, TokioResource> = new Map(
        resources.flatMap((resource) => {
            const parentId = resource.parentResourceId?.id;
            if (parentId === undefined) {
                return [];
            }
            const parent = state.resources.getBySpanId(parentId);
            if (parent) {
                return [[parentId, parent]];
            }
            return [];
        }),
    );

    for (const resource of resources) {
        if (!resource.id) {
            continue;
        }

        let metaId;
        if (resource.metadata) {
            metaId = resource.metadata.id;
        } else {
            continue;
        }

        const meta = state.metas.get(metaId);
        if (!meta) {
            continue;
        }

        if (!resource.kind) {
            continue;
        }
        let kind;
        try {
            kind = kindFromProto(resource.kind);
        } catch (e) {
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
            const parent = parents.get(parentId)!;
            parentStr = `${parent.id} (${parent.target}::${parent.concreteType})`;
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

export function addResources(update: Update) {
    if (update.resourceUpdate) {
        const resources = resourceUpdateToResources(update.resourceUpdate);

        for (const resource of resources) {
            state.resources.items.value.set(resource.id, resource);
        }

        for (const k in update.resourceUpdate.statsUpdate) {
            const resource = state.resources.getBySpanId(BigInt(k));
            if (resource) {
                const meta = state.metas.get(resource.metaId);
                if (!meta) {
                    continue;
                }
                resource.stats = fromProtoResourceStats(
                    update.resourceUpdate.statsUpdate[k],
                    meta,
                );
                state.resources.items.value.set(resource.id, resource);
            }
        }
    }
}

export function retainResources(retainFor: Duration) {
    const newResources = new Map<bigint, TokioResource>();
    for (const [id, resource] of state.resources.items.value) {
        if (resource.stats.droppedAt) {
            if (
                state.lastUpdatedAt.value !== undefined &&
                !state.lastUpdatedAt.value
                    .subtract(resource.stats.droppedAt)
                    .greaterThan(retainFor)
            ) {
                newResources.set(id, resource);
            }
        } else {
            newResources.set(id, resource);
        }
    }

    state.resources.items.value = newResources;
}

export function useResources() {
    if (state.isUpdateWatched) {
        return {
            pending: ref<boolean>(false),
            resourcesData: state.resources.items,
            lastUpdatedAt: state.lastUpdatedAt,
        };
    }

    const pending = ref<boolean>(true);

    // Async function to watch for updates.
    watchForUpdates(pending);

    return {
        pending,
        resourcesData: state.resources.items,
        lastUpdatedAt: state.lastUpdatedAt,
    };
}
