export class Duration {
    seconds: bigint;
    nanos: number;

    constructor(seconds: bigint, nanos: number) {
        this.seconds = seconds;
        this.nanos = nanos;
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
        const result = new Duration(
            this.seconds - other.seconds,
            this.nanos - other.nanos,
        );
        return result;
    }

    add(other: Duration): Duration {
        const result = new Duration(
            this.seconds + other.seconds,
            this.nanos + other.nanos,
        );
        return result;
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
}
