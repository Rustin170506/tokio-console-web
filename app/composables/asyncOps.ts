import { consola } from "consola";
import type { AsyncOpUpdate } from "~/gen/async_ops_pb";
import type { Update } from "~/gen/instrument_pb";
import { AsyncOp } from "~/types/asyncOp/asyncOp";
import { fromProtoAsyncOpStats } from "~/types/asyncOp/asyncOpStats";
import type { Duration } from "~/types/common/duration";

/**
 * Convert the async op update from the server to async ops.
 * @param asyncOpUpdate - The async op update from the server.
 * @returns The async ops.
 */
function asyncOpUpdateToOps(asyncOpUpdate: AsyncOpUpdate) {
    const result = new Array<AsyncOp>();
    const { newAsyncOps: ops, statsUpdate } = asyncOpUpdate;

    for (const op of ops) {
        if (!op.id) {
            consola.warn("skipping async op with no id", op);
            continue;
        }

        let metaId;
        if (op.metadata) {
            metaId = op.metadata.id;
        } else {
            consola.warn("async op has no metadata id, skipping", op);
            continue;
        }

        const meta = state.metas.get(metaId);
        if (!meta) {
            consola.warn("no metadata for async op, skipping", op, metaId);
            continue;
        }

        const spanId = op.id.id;
        const stats = statsUpdate[spanId.toString()];
        if (!stats) {
            continue;
        }
        // Delete
        delete statsUpdate[spanId.toString()];
        const asyncOpStats = fromProtoAsyncOpStats(
            stats,
            meta,
            state.tasks.ids,
        );

        const id = state.asyncOps.idFor(spanId);
        if (!op.resourceId) {
            continue;
        }
        const resourceId = state.resources.idFor(op.resourceId.id);
        let parentIdStr = "N/A";
        if (op.parentAsyncOpId) {
            parentIdStr = state.asyncOps
                .idFor(op.parentAsyncOpId.id)
                .toString();
        }
        const source = op.source;

        const o = new AsyncOp(
            id,
            parentIdStr,
            resourceId,
            metaId,
            source,
            asyncOpStats,
        );
        result.push(o);
    }
    return result;
}

/**
 * Add async ops to the state.
 * @param update - The update from the server.
 */
export function addAsyncOps(update: Update) {
    if (!update.asyncOpUpdate) return;

    const ops = asyncOpUpdateToOps(update.asyncOpUpdate);
    ops.forEach((op) => state.asyncOps.items.value.set(op.id, op));

    for (const k in update.asyncOpUpdate.statsUpdate) {
        const op = state.asyncOps.getBySpanId(BigInt(k));
        if (!op) continue;

        const meta = state.metas.get(op.metaId);
        if (!meta) continue;

        const stats = update.asyncOpUpdate.statsUpdate[k];
        const statsUpdate = fromProtoAsyncOpStats(stats, meta, state.tasks.ids);
        op.stats = statsUpdate;
        state.asyncOps.items.value.set(op.id, op);
    }
}

/**
 * Retain the async ops for the specified duration.
 * This will remove async ops that are older than the specified duration.
 * @param retainFor - The duration to retain the async ops.
 */
export function retainAsyncOps(retainFor: Duration) {
    const newOps = new Map<bigint, AsyncOp>();
    for (const [id, op] of state.asyncOps.items.value) {
        const shouldRetain =
            !op.stats.droppedAt ||
            state.lastUpdatedAt.value
                ?.subtract(op.stats.droppedAt)
                .greaterThan(retainFor) === false;

        if (shouldRetain) {
            newOps.set(id, op);
        }
    }
    state.asyncOps.items.value = newOps;
}

/**
 * useAsyncOps is a composable function that returns the async ops.
 * If the async ops are not updated, it will watch for updates.
 * @returns The async ops and the last updated at timestamp.
 */
export function useAsyncOps() {
    const pending = ref<boolean>(!state.isUpdateWatched);

    if (!state.isUpdateWatched) {
        // Async function to watch for updates.
        watchForUpdates(pending);
    }

    return {
        pending,
        asyncOpsData: state.asyncOps.items,
        lastUpdatedAt: state.lastUpdatedAt,
    };
}
