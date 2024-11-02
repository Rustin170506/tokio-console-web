import { Duration } from "../common/duration";
import {
    deserializeHistogram,
    Percentile as RawPercentile,
    DurationCount as RawDurationCount,
} from "~/gen/histogram";
import type { TaskDetails } from "~/gen/tasks_pb";

/**
 * Percentile represents a percentile value and its corresponding duration.
 * For example, a 99th percentile of 100ms means that 99% of the data points are less than or equal to 100ms.
 */
export interface Percentile {
    percentile: number;
    duration: Duration;
}

/**
 * DurationCount represents a duration and the number of times that duration was observed.
 */
export interface DurationCount {
    duration: Duration;
    count: bigint;
}

/**
 * DurationDetails represents the details of a duration histogram.
 * It includes the percentiles, histogram, max, and min values.
 */
export interface DurationDetails {
    percentiles: Percentile[];
    histogram: DurationCount[];
    max: Duration;
    min: Duration;
}

/**
 * TokioTaskDetails represents the details of a tokio task.
 * It includes the poll times and scheduled times.
 */
export interface TokioTaskDetails {
    pollTimes: DurationDetails;
    scheduledTimes?: DurationDetails;
}

/**
 * fromProtoTaskDetails converts a protobuf TaskDetails to a TokioTaskDetails.
 * It includes the poll times and scheduled times histograms.
 * @param details - the protobuf TaskDetails
 * @param width - the width of the details chart
 * @returns the TokioTaskDetails
 */
export function fromProtoTaskDetails(
    details: TaskDetails,
    width: number,
): TokioTaskDetails {
    const toDurationPercentile = (p: RawPercentile) => ({
        percentile: p.percentile,
        duration: Duration.fromNano(p.value),
    });
    const toDurationCount = (p: RawDurationCount) => ({
        duration: Duration.fromNano(p.duration),
        count: p.count,
    });

    const createHistogram = (rawHistogram: Uint8Array) => {
        // wasm function.
        const miniHistogram = deserializeHistogram(rawHistogram, width);
        const percentiles = miniHistogram.percentiles.map(toDurationPercentile);
        const histogram = miniHistogram.data.map(toDurationCount);

        return {
            percentiles,
            histogram,
            max: Duration.fromNano(miniHistogram.max),
            min: Duration.fromNano(miniHistogram.min),
        };
    };

    const pollTimes =
        details.pollTimesHistogram.case === "histogram"
            ? createHistogram(details.pollTimesHistogram.value.rawHistogram)
            : // legacyHistogram
              createHistogram(details.pollTimesHistogram.value!);

    const scheduledTimes = details.scheduledTimesHistogram?.rawHistogram
        ? createHistogram(details.scheduledTimesHistogram.rawHistogram)
        : undefined;

    return {
        pollTimes,
        scheduledTimes,
    };
}
