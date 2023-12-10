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
        return Number(this.seconds) * 1000;
    }

    asMicroseconds(): number {
        return Number(this.seconds) * 1000000 + this.nanos / 1000;
    }

    subtract(other: Duration): Duration {
        return new Duration(
            this.seconds - other.seconds,
            this.nanos - other.nanos,
        );
    }

    add(other: Duration): Duration {
        return new Duration(
            this.seconds + other.seconds,
            this.nanos + other.nanos,
        );
    }

    toString(): string {
        if (this.asDays() >= 1) {
            return `${Math.floor(this.asDays())}d`;
        } else if (this.asHours() >= 1) {
            return `${Math.floor(this.asHours())}h`;
        } else if (this.asMinutes() >= 1) {
            return `${Math.floor(this.asMinutes())}m`;
        } else if (this.asSeconds() >= 1) {
            return `${Math.floor(this.asSeconds())}s`;
        } else if (this.asMilliseconds() >= 1) {
            return `${Math.floor(this.asMilliseconds())}ms`;
        } else if (this.asMicroseconds() >= 1) {
            return `${Math.floor(this.asMicroseconds())}µs`;
        } else {
            return `${this.nanos}ns`;
        }
    }
}
