// A result for a warning check.
export enum Warning {
    // No warning for this entity.
    Ok,
    // A warning has been detected for this entity.
    Warn,
    // The warning should be rechecked as the conditions to allow for checking
    // are not satisfied yet
    Recheck,
}

// A warning for a particular type of monitored entity (e.g. task or resource).
export interface Warn<T> {
    name: string;
    // Returns if the warning applies to `val`.
    check(val: T): Warning;
    // Formats a description of the warning detected for a *specific* `val`.
    format(val: T): string;
    // Returns a string summarizing the warning *in general*, suitable for
    // displaying in a list of all detected warnings.
    summary(): string;
}

export type { Warn as Linter };
