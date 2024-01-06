import { describe, test, expect } from "vitest";
import { Location } from "~/gen/common_pb";
import { formatLocation } from "~/types/common/field";

describe("formatLocation", () => {
    test('should return "<unknown location>" when location is undefined', () => {
        expect(formatLocation()).toBe("<unknown location>");
    });

    test("should return modulePath when it is defined", () => {
        const loc = { modulePath: "module/path" };
        expect(formatLocation(new Location(loc))).toBe("module/path");
    });

    test("should return file when modulePath is not defined", () => {
        const loc = { file: "file/path" };
        expect(formatLocation(new Location(loc))).toBe("file/path");
    });

    test('should return "<unknown location>" when neither modulePath nor file is defined', () => {
        const loc = {};
        expect(formatLocation(new Location(loc))).toBe("<unknown location>");
    });

    test("should append line and column to the result when they are defined", () => {
        const loc = { modulePath: "module/path", line: 10, column: 20 };
        expect(formatLocation(new Location(loc))).toBe("module/path:10:20");
    });

    describe("when location is undefined", () => {
        test('should return "<unknown location>"', () => {
            expect(formatLocation()).toBe("<unknown location>");
        });
    });

    test('should return "<unknown location>" when modulePath is not defined and file is an empty string', () => {
        const loc = { file: "" };
        expect(formatLocation(new Location(loc))).toBe("<unknown location>");
    });

    describe("when line and column are defined", () => {
        test("should append line and column to the result", () => {
            const loc = { modulePath: "module/path", line: 10, column: 20 };
            expect(formatLocation(new Location(loc))).toBe("module/path:10:20");
        });

        test("should append line and column to the result even if they are 0", () => {
            const loc = { modulePath: "module/path", line: 0, column: 0 };
            expect(formatLocation(new Location(loc))).toBe("module/path:0:0");
        });
    });

    test("should truncate the registry path when file contains a registry path", () => {
        const loc = { file: "some/path/cargo/registry/src/some-registry/" };
        expect(formatLocation(new Location(loc))).toBe("<cargo>/");
    });

    test("should truncate the git checkout path when file contains a git checkout path", () => {
        const loc = { file: "some/path/cargo/git/checkouts/some-checkout/" };
        expect(formatLocation(new Location(loc))).toBe(
            "<cargo>/some-checkout/",
        );
    });
});
