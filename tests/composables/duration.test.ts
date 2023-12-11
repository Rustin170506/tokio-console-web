import { Duration } from "../../composables/duration";

describe("Duration", () => {
    test("constructor", () => {
        const duration = new Duration(BigInt(3600), 500);
        expect(duration.seconds).toEqual(BigInt(3600));
        expect(duration.nanos).toEqual(500);
    });

    test("asDays", () => {
        const duration = new Duration(BigInt(86400), 0);
        expect(duration.asDays()).toEqual(1);
    });

    test("asHours", () => {
        const duration = new Duration(BigInt(3600), 0);
        expect(duration.asHours()).toEqual(1);
    });

    test("asMinutes", () => {
        const duration = new Duration(BigInt(60), 0);
        expect(duration.asMinutes()).toEqual(1);
    });

    test("asSeconds", () => {
        const duration = new Duration(BigInt(1), 0);
        expect(duration.asSeconds()).toEqual(1);
    });

    test("asMilliseconds", () => {
        const duration = new Duration(BigInt(1), 500000);
        expect(duration.asMilliseconds()).toEqual(1000.5);
    });

    test("asMicroseconds", () => {
        const duration = new Duration(BigInt(1), 500);
        expect(duration.asMicroseconds()).toEqual(1000000.5);
    });

    test("subtract", () => {
        const duration1 = new Duration(BigInt(3600), 500);
        const duration2 = new Duration(BigInt(1800), 250);
        const result = duration1.subtract(duration2);
        expect(result.seconds).toEqual(BigInt(1800));
        expect(result.nanos).toEqual(250);
    });

    test("add", () => {
        const duration1 = new Duration(BigInt(3600), 500);
        const duration2 = new Duration(BigInt(1800), 250);
        const result = duration1.add(duration2);
        expect(result.seconds).toEqual(BigInt(5400));
        expect(result.nanos).toEqual(750);
    });

    test("greaterThan", () => {
        const duration1 = new Duration(BigInt(3600), 500);
        const duration2 = new Duration(BigInt(1800), 250);
        expect(duration1.greaterThan(duration2)).toBe(true);
        expect(duration2.greaterThan(duration1)).toBe(false);
    });

    test("toString for days and hours", () => {
        const duration = new Duration(BigInt(90000), 0); // 25 hours
        expect(duration.toString()).toBe("1d 1h ");
    });

    test("toString for hours and minutes", () => {
        const duration = new Duration(BigInt(3660), 0); // 1 hour and 1 minute
        expect(duration.toString()).toBe("1h 1m ");
    });

    test("toString for minutes and seconds", () => {
        const duration = new Duration(BigInt(61), 0); // 1 minute and 1 second
        expect(duration.toString()).toBe("1m 1s ");
    });

    test("toString for milliseconds", () => {
        const duration = new Duration(BigInt(0), 500000000); // 1 second and 500 milliseconds
        expect(duration.toString()).toBe("500ms");
    });

    test("toString for only nanoseconds", () => {
        const duration = new Duration(BigInt(0), 500); // 500 nanoseconds
        expect(duration.toString()).toBe("500ns");
    });
});
