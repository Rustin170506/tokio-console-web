import type { Duration } from "./duration";

/**
 * DurationWithStyle is a wrapper around the Duration type that includes a tailwind class to use for this duration.
 * It is used to display the duration in a color that represents the magnitude of the duration.
 */
export class DurationWithStyle {
    value: Duration;
    // The tailwind class to use for this duration.
    class: string;

    constructor(value: Duration, className: string) {
        this.value = value;
        this.class = className;
    }

    /**
     * Provides a human-readable string representation of the duration.
     * @returns a string representation of the duration.
     */
    toString(): string {
        return this.value.toString();
    }

    /**
     * Returns the duration as a number of microseconds.
     * Used for sorting.
     * @returns the duration as a number of microseconds.
     */
    valueOf(): number {
        return this.value.valueOf();
    }
}

export function getDurationWithClass(duration: Duration): DurationWithStyle {
    const days = duration.asDays();
    const hours = duration.asHours();
    const minutes = duration.asMinutes();
    const seconds = duration.asSeconds();
    const milliseconds = duration.asMilliseconds();

    let className: string;

    if (days >= 1) {
        className = "text-blue-500 dark:text-blue-300";
    } else if (hours >= 1) {
        className = "text-cyan-500 dark:text-cyan-300";
    } else if (minutes >= 1) {
        className = "text-green-500 dark:text-green-300";
    } else if (seconds >= 1) {
        className = "text-yellow-500 dark:text-yellow-300";
    } else if (milliseconds >= 1) {
        className = "text-red-500 dark:text-red-300";
    } else {
        className = "text-gray-500 dark:text-gray-300";
    }

    return new DurationWithStyle(duration, className);
}
