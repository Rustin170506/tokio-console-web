import { Duration } from "../common/duration";
import {
    deserializeHistogram,
    Percentile as RawPercentile,
    DurationCount as RawDurationCount,
} from "~/histogram/pkg/histogram";
import type { TaskDetails } from "~/gen/tasks_pb";

export interface Percentile {
    percentile: number;
    duration: Duration;
}

export interface DurationCount {
    duration: Duration;
    count: bigint;
}

export interface DurationDetails {
    percentiles: Percentile[];
    histogram: DurationCount[];
    max: Duration;
    min: Duration;
}

export interface TokioTaskDetails {
    pollTimes: DurationDetails;
    scheduledTimes?: DurationDetails;
}

export function fromProtoTaskDetails(details: TaskDetails): TokioTaskDetails {
    const convertToDurationPercentile = (p: RawPercentile) => ({
        percentile: p.percentile,
        duration: Duration.fromNano(p.value),
    });

    const convertToDurationCount = (p: RawDurationCount) => ({
        duration: Duration.fromNano(p.duration),
        count: p.count,
    });

    const createHistogram = (rawHistogram: Uint8Array) => {
        const miniHistogram = deserializeHistogram(rawHistogram);

        const percentiles = miniHistogram.percentiles.map(
            convertToDurationPercentile,
        );
        const histogram = miniHistogram.data.map(convertToDurationCount);

        return {
            percentiles,
            histogram,
            max: Duration.fromNano(miniHistogram.max),
            min: Duration.fromNano(miniHistogram.min),
        };
    };

    let pollTimes: TokioTaskDetails["pollTimes"] | undefined;
    let scheduledTimes: TokioTaskDetails["scheduledTimes"] | undefined;

    if (details.pollTimesHistogram.case === "histogram") {
        pollTimes = createHistogram(
            details.pollTimesHistogram.value.rawHistogram,
        );
    }

    if (details.pollTimesHistogram.case === "legacyHistogram") {
        pollTimes = createHistogram(details.pollTimesHistogram.value);
    }

    if (details.scheduledTimesHistogram?.rawHistogram) {
        scheduledTimes = createHistogram(
            details.scheduledTimesHistogram.rawHistogram,
        );
    }

    return {
        pollTimes: pollTimes!,
        scheduledTimes,
    };
}
