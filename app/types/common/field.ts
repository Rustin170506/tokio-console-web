import type { Metadata } from "./metadata";
import { Field as ProtoField } from "~/gen/common_pb";
import type { Location } from "~/gen/common_pb";

export function truncateRegistryPath(s: string): string {
    const regex = /.*\/cargo(\/registry\/src\/[^/]*\/|\/git\/checkouts\/)/;
    return s.replace(regex, "<cargo>/");
}

export function formatLocation(loc?: Location): string {
    if (loc) {
        let result = "";
        if (loc.modulePath) {
            result = loc.modulePath;
        } else if (loc.file) {
            const truncated = truncateRegistryPath(loc.file);
            result = truncated;
        } else {
            return "<unknown location>";
        }

        if (loc.line !== undefined) {
            result += `:${loc.line}`;

            if (loc.column !== undefined) {
                result += `:${loc.column}`;
            }
        }

        return result;
    }
    return "<unknown location>";
}

export enum FieldValueType {
    Bool = "Bool",
    Str = "Str",
    U64 = "U64",
    I64 = "I64",
    Debug = "Debug",
}

export class FieldValue {
    type: FieldValueType;
    value: boolean | string | bigint;

    constructor(type: FieldValueType, value: boolean | string | bigint) {
        this.type = type;
        this.value = value;
    }

    truncateRegistryPath(): FieldValue {
        if (
            (this.type === FieldValueType.Str ||
                this.type === FieldValueType.Debug) &&
            typeof this.value === "string"
        ) {
            this.value = truncateRegistryPath(this.value);
        }
        return this;
    }

    ensureNonempty(): FieldValue | undefined {
        if (
            (this.type === FieldValueType.Str ||
                this.type === FieldValueType.Debug) &&
            this.value === ""
        ) {
            return undefined;
        }
        return this;
    }

    static fromProto(field: ProtoField): FieldValue {
        switch (field.value.case) {
            case "debugVal":
                return new FieldValue(FieldValueType.Debug, field.value.value);
            case "strVal":
                return new FieldValue(FieldValueType.Str, field.value.value);
            case "u64Val":
                return new FieldValue(FieldValueType.U64, field.value.value);
            case "i64Val":
                return new FieldValue(FieldValueType.I64, field.value.value);
            case "boolVal":
                return new FieldValue(FieldValueType.Bool, field.value.value);
            default:
                throw new Error("Invalid field value case");
        }
    }
}

export class Field {
    static SPAWN_LOCATION = "spawn.location";
    static KIND = "kind";
    static NAME = "task.name";
    static TASK_ID = "task.id";

    name: string;
    value: FieldValue;

    constructor(name: string, value: FieldValue) {
        this.name = name;
        this.value = value;
    }

    static fromProto(field: ProtoField, meta: Metadata): Field | undefined {
        const nameValue = field.name;
        if (nameValue.case === undefined) {
            return undefined;
        }

        let name = "";
        switch (nameValue.case) {
            case "strName": {
                name = nameValue.value;
                break;
            }
            case "nameIdx": {
                const index = nameValue.value;
                const metaId = field.metadataId?.id;
                if (meta.id !== metaId) {
                    return undefined;
                }
                if (meta.fieldNames[Number(index)]) {
                    name = meta.fieldNames[Number(index)];
                } else {
                    return undefined;
                }
                break;
            }
        }

        let value = FieldValue.fromProto(field).ensureNonempty();
        // If the field is invalid or it has a string value which is empty, return null
        if (!name || !value) {
            return undefined;
        }

        // If the field name is 'SPAWN_LOCATION', truncate the registry path
        if (name === Field.SPAWN_LOCATION) {
            value = value.truncateRegistryPath();
        }

        return new Field(name.toString(), value);
    }
}
