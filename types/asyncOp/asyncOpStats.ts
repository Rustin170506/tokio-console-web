import type { Duration, Timestamp } from "../common/duration";
import type { Attribute } from "../resource/tokioResourceStats";

export interface AsyncOpStats {
    createdAt: Timestamp;
    droppedAt?: Timestamp;

    polls: bigint;
    busy: Duration;
    last_poll_busy?: Duration;
    last_poll_ended?: Timestamp;
    idle?: Duration;
    total?: Duration;
    taskId?: bigint;
    taskIdStr?: string;
    attributes: Array<Attribute>;
}
