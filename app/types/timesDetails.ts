import {
    getDurationWithClass,
    type DurationWithStyle,
} from "./common/durationWithStyle";
import type { Duration } from "./common/duration";
import type {
    DurationCount,
    DurationDetails,
    Percentile,
    TokioTaskDetails,
} from "./task/tokioTaskDetails";

export interface TimesDetails {
    percentiles: {
        percentile: string;
        duration: DurationWithStyle;
    }[];
    histogram: {
        duration: Duration;
        count: number;
    }[];
    min: DurationWithStyle | null;
    max: DurationWithStyle | null;
}

export interface TaskDetails {
    pollTimes: TimesDetails;
    scheduledTimes: TimesDetails | null;
}

function mapPercentiles(percentiles: Percentile[]) {
    return percentiles.map((p) => {
        return {
            percentile: `p${p.percentile}`,
            duration: getDurationWithClass(p.duration),
        };
    });
}

function mapHistogram(histogram: DurationCount[]) {
    return histogram.map((h) => {
        return {
            duration: h.duration,
            count: Number(h.count),
        };
    });
}

function mapTimes(times: DurationDetails): TimesDetails {
    return {
        percentiles: mapPercentiles(times.percentiles),
        histogram: mapHistogram(times.histogram),
        min: getDurationWithClass(times.min),
        max: getDurationWithClass(times.max),
    };
}

export function toTaskDetails(details: TokioTaskDetails): TaskDetails {
    const pollTimes = mapTimes(details.pollTimes);
    const scheduledTimes = details.scheduledTimes
        ? mapTimes(details.scheduledTimes)
        : null;

    return {
        pollTimes,
        scheduledTimes,
    };
}
