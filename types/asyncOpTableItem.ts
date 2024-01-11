import type { AsyncOp } from "./asyncOp/asyncOp";
import type { Timestamp } from "./common/duration";
import {
    getDurationWithClass,
    type DurationWithStyle,
} from "./common/durationWithStyle";
import {
    makeFormattedAttribute,
    type FormattedAttribute,
} from "./resourceTableItem";

export interface AsyncOpTableItem {
    id: bigint;
    parent: string;
    task: string;
    source: string;
    total: DurationWithStyle;
    busy: DurationWithStyle;
    idle: DurationWithStyle;
    polls: bigint;
    attributes: Array<FormattedAttribute>;
    class?: string;
}

export function toAsyncOpTableItem(
    asyncOp: AsyncOp,
    lastUpdatedAt: Timestamp,
): AsyncOpTableItem {
    return {
        id: asyncOp.id,
        parent: asyncOp.parentIdStr,
        task: asyncOp.stats.taskIdStr,
        source: asyncOp.source,
        total: getDurationWithClass(asyncOp.totalDuration(lastUpdatedAt)),
        busy: getDurationWithClass(asyncOp.busyDuration(lastUpdatedAt)),
        idle: getDurationWithClass(asyncOp.idleDuration(lastUpdatedAt)),
        polls: asyncOp.stats.polls,
        attributes: asyncOp.stats.attributes.map(makeFormattedAttribute),
        class: asyncOp.isDropped()
            ? "bg-slate-50 dark:bg-slate-950 animate-pulse"
            : undefined,
    };
}
