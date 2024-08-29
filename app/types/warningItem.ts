import type { TokioTask } from "./task/tokioTask";
import type { Warn } from "./warning/warn";

export interface WarningStatItem {
    name: string;
    count: number;
    summary: string;
}

export function toWarningStats(
    taskWarnings: Array<Warn<TokioTask>>,
): Array<WarningStatItem> {
    const stats: Record<string, WarningStatItem> = {};

    taskWarnings.forEach((warn) => {
        if (!stats[warn.name]) {
            stats[warn.name] = {
                name: warn.name,
                count: 0,
                summary: warn.summary(),
            };
        }
        stats[warn.name].count++;
    });

    return Object.values(stats);
}
