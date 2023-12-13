export class Duration {
    seconds: bigint;
    nanos: number;

    constructor(seconds: bigint, nanos: number) {
        this.seconds = seconds;
        this.nanos = nanos;
        this.normalize();
    }

    normalize(): Duration {
        let adjustment = 0;
        if (this.nanos >= 1e9) {
            adjustment = Math.floor(this.nanos / 1e9);
            this.seconds += BigInt(adjustment);
            this.nanos -= adjustment * 1e9;
        } else if (this.nanos < 0) {
            adjustment = Math.floor(-this.nanos / 1e9) + 1;
            this.seconds -= BigInt(adjustment);
            this.nanos += adjustment * 1e9;
        }
        return this;
    }

    asDays(): number {
        return Number(this.seconds) / 86400;
    }

    asHours(): number {
        return Number(this.seconds) / 3600;
    }

    asMinutes(): number {
        return Number(this.seconds) / 60;
    }

    asSeconds(): number {
        return Number(this.seconds);
    }

    asMilliseconds(): number {
        return Number(this.seconds) * 1000 + this.nanos / 1e6;
    }

    asMicroseconds(): number {
        return Number(this.seconds) * 1e6 + this.nanos / 1000;
    }

    subtract(other: Duration): Duration {
        const seconds = this.seconds - other.seconds;
        const nanos = this.nanos - other.nanos;
        const result = new Duration(seconds, nanos);
        return result.normalize();
    }

    add(other: Duration): Duration {
        const result = new Duration(
            this.seconds + other.seconds,
            this.nanos + other.nanos,
        );
        return result.normalize();
    }

    greaterThan(other: Duration): boolean {
        return (
            this.seconds > other.seconds ||
            (this.seconds === other.seconds && this.nanos > other.nanos)
        );
    }

    toString(): string {
        const totalSeconds = this.asSeconds();
        const units = [
            { value: Math.floor(this.asDays()), unit: "d" },
            { value: Math.floor(this.asHours()) % 24, unit: "h" },
            { value: Math.floor(this.asMinutes()) % 60, unit: "m" },
            { value: Math.floor(totalSeconds) % 60, unit: "s" },
            { value: Math.floor(this.asMilliseconds()) % 1000, unit: "ms" },
            { value: Math.floor(this.asMicroseconds()) % 1000, unit: "µs" },
            { value: this.nanos, unit: "ns" },
        ];

        let str = "";
        let partsIncluded = 0;

        if (totalSeconds >= 60) {
            // For durations longer than 60 seconds, include up to two non-zero units
            for (const { value, unit } of units) {
                if (value > 0) {
                    str += `${value}${unit} `;
                    partsIncluded++;
                    if (partsIncluded === 2) break;
                }
            }
        } else {
            // For durations shorter than 60 seconds, display the most significant non-zero unit
            for (const { value, unit } of units) {
                if (value > 0) {
                    str = `${value}${unit}`;
                    break;
                }
            }
        }

        return str || `${this.nanos}ns`;
    }

    // Custom valueOf() method to allow for easy comparison of durations.
    valueOf(): number {
        return this.asMicroseconds();
    }

    static now(): Duration {
        return new Duration(BigInt(Math.floor(Date.now() / 1000)), 0);
    }
}

// It can also be used as a timestamp.
export { Duration as Timestamp };
