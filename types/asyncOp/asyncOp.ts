import type { AsyncOpStats } from "./asyncOpStats";

export interface AsyncOp {
    id: bigint;
    parentIdStr: string;
    resourceId: bigint;
    metaId: bigint;
    srouce: string;
    stats: AsyncOpStats;
}
