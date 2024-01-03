import { describe, test, expect } from "vitest";
import { Duration } from "~/types/task/duration";

describe("Duration", () => {
    test("constructor", () => {
        const duration = new Duration(3600n, 500);
        expect(duration.seconds).toEqual(3600n);
        expect(duration.nanos).toEqual(500);
    });

    test("asDays", () => {
        const duration = new Duration(86400n, 0);
        expect(duration.asDays()).toEqual(1);
    });

    test("asHours", () => {
        const duration = new Duration(3600n, 0);
        expect(duration.asHours()).toEqual(1);
    });

    test("asMinutes", () => {
        const duration = new Duration(60n, 0);
        expect(duration.asMinutes()).toEqual(1);
    });

    test("asSeconds", () => {
        const duration = new Duration(1n, 0);
        expect(duration.asSeconds()).toEqual(1);
    });

    test("asMilliseconds", () => {
        const duration = new Duration(1n, 500000);
        expect(duration.asMilliseconds()).toEqual(1000.5);
    });

    test("asMicroseconds", () => {
        const duration = new Duration(1n, 500);
        expect(duration.asMicroseconds()).toEqual(1000000.5);
    });

    test("subtract", () => {
        const duration1 = new Duration(3600n, 500);
        const duration2 = new Duration(1800n, 250);
        const result = duration1.subtract(duration2);
        expect(result.seconds).toEqual(1800n);
        expect(result.nanos).toEqual(250);
    });

    test("add", () => {
        const duration1 = new Duration(3600n, 500);
        const duration2 = new Duration(1800n, 250);
        const result = duration1.add(duration2);
        expect(result.seconds).toEqual(5400n);
        expect(result.nanos).toEqual(750);
    });

    test("greaterThan", () => {
        const duration1 = new Duration(3600n, 500);
        const duration2 = new Duration(1800n, 250);
        expect(duration1.greaterThan(duration2)).toBe(true);
        expect(duration2.greaterThan(duration1)).toBe(false);
    });

    test("toString for days and hours", () => {
        const duration = new Duration(90000n, 0); // 25 hours
        expect(duration.toString()).toBe("1d 1h ");
    });

    test("toString for hours and minutes", () => {
        const duration = new Duration(3660n, 0); // 1 hour and 1 minute
        expect(duration.toString()).toBe("1h 1m ");
    });

    test("toString for minutes and seconds", () => {
        const duration = new Duration(61n, 0); // 1 minute and 1 second
        expect(duration.toString()).toBe("1m 1s ");
    });

    test("toString for milliseconds", () => {
        const duration = new Duration(0n, 500000000); // 500 milliseconds
        expect(duration.toString()).toBe("500ms");
    });

    test("toString for only nanoseconds", () => {
        const duration = new Duration(0n, 500); // 500 nanoseconds
        expect(duration.toString()).toBe("500ns");
    });

    test("normalize for nanoseconds greater than 1e9", () => {
        const duration = new Duration(0n, 1.5e9);
        duration.normalize();
        expect(duration.seconds).toBe(1n);
        expect(duration.nanos).toBe(0.5e9);
    });

    test("subtract and normalize negative result", () => {
        const duration1 = new Duration(2n, 449);
        const duration2 = new Duration(1n, 500);
        const result = duration1.subtract(duration2);
        expect(result.seconds).toBe(0n);
        expect(result.nanos).toBe(999999949);
    });

    test("add and normalize", () => {
        const duration1 = new Duration(2n, 999999949);
        const duration2 = new Duration(1n, 500);
        const result = duration1.add(duration2);
        expect(result.seconds).toBe(4n);
        expect(result.nanos).toBe(449);
    });

    test("fromNano", () => {
        const duration = Duration.fromNano(BigInt(1.5e9));
        expect(duration.seconds).toBe(1n);
        expect(duration.nanos).toBe(500000000);
    });
});
