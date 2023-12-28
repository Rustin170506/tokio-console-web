import { Duration } from "./duration";
import {
    deserializeHistogram,
    Percentile as RawPercentile,
} from "~/histogram/pkg/histogram";
import type { TaskDetails } from "~/gen/tasks_pb";

export interface Percentile {
    percentile: number;
    duration: Duration;
}

export interface TokioTaskDetails {
    pollTimes: {
        percentiles: Percentile[];
    };
}

export function fromProtoTaskDetails(details: TaskDetails): TokioTaskDetails {
    const convertToDurationPercentile = (p: RawPercentile) => {
        return {
            percentile: p.percentile,
            duration: Duration.fromNano(p.value),
        };
    };

    if (details.pollTimesHistogram.case === "histogram") {
        const percentiles = deserializeHistogram(
            details.pollTimesHistogram.value.rawHistogram,
        );

        const result = percentiles.map(convertToDurationPercentile);

        return {
            pollTimes: {
                percentiles: result,
            },
        };
    }

    if (details.pollTimesHistogram.case === "legacyHistogram") {
        const percentiles = deserializeHistogram(
            details.pollTimesHistogram.value,
        );

        const result = percentiles.map(convertToDurationPercentile);

        return {
            pollTimes: {
                percentiles: result,
            },
        };
    }

    throw new Error("invalid pollTimesHistogram");
}
