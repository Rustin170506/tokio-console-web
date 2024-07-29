import type { TokioTask } from "./task/tokioTask";
import type { Warn } from "./warning/warn";

export interface WarningItem {
    title: string;
    description: string;
}

export function toTaskWarningItems(
    taskWarnings: Array<Warn<TokioTask>>,
): Array<WarningItem> {
    return taskWarnings.map((warn) => ({
        title: warn.name,
        description: warn.summary(),
    }));
}
