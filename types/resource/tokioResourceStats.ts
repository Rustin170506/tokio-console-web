import type { Duration, Timestamp } from "../common/duration";

export interface TokioResourceStats {
    createdAt: Timestamp;
    droppedAt?: Timestamp;
    total?: Duration;
    formattedAttributes: Array<Array<string>>;
}
