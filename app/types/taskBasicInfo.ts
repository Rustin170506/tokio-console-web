import {
    getDurationWithClass,
    type DurationWithStyle,
} from "./common/durationWithStyle";
import type { Timestamp } from "./common/duration";
import type { TokioTask } from "./task/tokioTask";
import { toTaskTableItem, type TaskTableItem } from "./taskTableItem";

export interface TaskBasicInfo extends TaskTableItem {
    busyPercentage: string;
    scheduledPercentage: string;
    idlePercentage: string;
    wakes: bigint;
    wakerClones: bigint;
    wakerDrops: bigint;
    lastWake?: Timestamp;
    selfWakes: bigint;
    wakerCount: bigint;
    lastWokenDuration?: DurationWithStyle;
}

export function toTaskBasicInfo(
    task: TokioTask,
    lastUpdatedAt: Timestamp,
): TaskBasicInfo {
    const stats = task.stats;
    const taskTableItemData = toTaskTableItem(task, lastUpdatedAt);
    const sinceWakeDuration = task.sinceWakeDuration(lastUpdatedAt);
    return {
        ...taskTableItemData,
        busyPercentage: formatPercentage(
            task.durationPercent(lastUpdatedAt, taskTableItemData.busy.value),
        ),
        scheduledPercentage: formatPercentage(
            task.durationPercent(lastUpdatedAt, taskTableItemData.sched.value),
        ),
        idlePercentage: formatPercentage(
            task.durationPercent(lastUpdatedAt, taskTableItemData.idle.value),
        ),
        wakes: stats.wakes,
        wakerClones: stats.wakerClones,
        wakerDrops: stats.wakerDrops,
        lastWake: stats.lastWake,
        selfWakes: stats.selfWakes,
        wakerCount: task.wakerCount(),
        lastWokenDuration: sinceWakeDuration
            ? getDurationWithClass(sinceWakeDuration)
            : undefined,
    };
}

function formatPercentage(value: number): string {
    return value.toFixed(2) + "%";
}
