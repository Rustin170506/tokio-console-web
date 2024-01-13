import type { AsyncOpUpdate } from "~/gen/async_ops_pb";
import type { Update } from "~/gen/instrument_pb";
import { AsyncOp } from "~/types/asyncOp/asyncOp";
import { fromProtoAsyncOpStats } from "~/types/asyncOp/asyncOpStats";
import type { Duration } from "~/types/common/duration";

function asyncOpUpdateToOps(asyncOpUpdate: AsyncOpUpdate) {
    const result = new Array<AsyncOp>();
    const ops = asyncOpUpdate.newAsyncOps;
    const statsUpdate = asyncOpUpdate.statsUpdate;
    for (const op of ops) {
        if (!op.id) {
            continue;
        }

        let metaId;
        if (op.metadata) {
            metaId = op.metadata.id;
        } else {
            continue;
        }

        const meta = state.metas.get(metaId);
        if (!meta) {
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

export function addAsyncOps(update: Update) {
    if (update.asyncOpUpdate) {
        const ops = asyncOpUpdateToOps(update.asyncOpUpdate);
        for (const op of ops) {
            state.asyncOps.items.value.set(op.id, op);
        }

        for (const k in update.asyncOpUpdate.statsUpdate) {
            const op = state.asyncOps.getBySpanId(BigInt(k));
            if (op) {
                const meta = state.metas.get(op.metaId);
                if (!meta) {
                    continue;
                }
                const stats = update.asyncOpUpdate.statsUpdate[k];
                const statsUpdate = fromProtoAsyncOpStats(
                    stats,
                    meta,
                    state.tasks.ids,
                );
                op.stats = statsUpdate;
                state.asyncOps.items.value.set(op.id, op);
            }
        }
    }
}

export function retainAsyncOps(retainFor: Duration) {
    const newOps = new Map<bigint, AsyncOp>();
    for (const [id, op] of state.asyncOps.items.value) {
        if (op.stats.droppedAt) {
            if (
                state.lastUpdatedAt.value &&
                !state.lastUpdatedAt.value
                    .subtract(op.stats.droppedAt)
                    .greaterThan(retainFor)
            ) {
                newOps.set(id, op);
            }
        } else {
            newOps.set(id, op);
        }
    }

    state.asyncOps.items.value = newOps;
}

export function useAsyncOps() {
    if (state.isUpdateWatched) {
        return {
            pending: ref<boolean>(false),
            asyncOpsData: state.asyncOps.items,
            lastUpdatedAt: state.lastUpdatedAt,
        };
    }

    const pending = ref<boolean>(true);

    // Async function to watch for updates.
    watchForUpdates(pending);

    return {
        pending,
        asyncOpsData: state.asyncOps.items,
        lastUpdatedAt: state.lastUpdatedAt,
    };
}
