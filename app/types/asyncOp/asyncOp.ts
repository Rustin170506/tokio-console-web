import type { Duration, Timestamp } from "../common/duration";
import type { AsyncOpStats } from "./asyncOpStats";

export class AsyncOp {
    id: bigint;
    parentIdStr: string;
    resourceId: bigint;
    metaId: bigint;
    source: string;
    stats: AsyncOpStats;

    constructor(
        id: bigint,
        parentIdStr: string,
        resourceId: bigint,
        metaId: bigint,
        source: string,
        stats: AsyncOpStats,
    ) {
        this.id = id;
        this.parentIdStr = parentIdStr;
        this.resourceId = resourceId;
        this.metaId = metaId;
        this.source = source;
        this.stats = stats;
    }

    totalDuration(since: Timestamp): Duration {
        return this.stats.total || since.subtract(this.stats.createdAt);
    }

    busyDuration(since: Timestamp): Duration {
        if (this.stats.lastPollStarted && !this.stats.lastPollEnded) {
            const currentTimeInPoll = since.subtract(
                this.stats.lastPollStarted,
            );
            return this.stats.busy.add(currentTimeInPoll);
        }
        return this.stats.busy;
    }

    idleDuration(since: Timestamp): Duration {
        return (
            this.stats.idle ||
            this.totalDuration(since).subtract(this.busyDuration(since))
        );
    }

    isDropped(): boolean {
        return !this.stats.total;
    }
}
