import type { Timestamp } from "./common/duration";
import {
    getDurationWithClass,
    type DurationWithStyle,
} from "./common/durationWithStyle";
import { Visibility, type TokioResource } from "./resource/tokioResource";
import type { Attribute } from "./resource/tokioResourceStats";

export interface FormattedAttribute {
    name: {
        value: string;
        class: string;
    };
    value: {
        value: string;
        class: string;
    };
    unit: {
        value: string;
        class: string;
    };
}

export function makeFormattedAttribute(
    attribute: Attribute,
): FormattedAttribute {
    const keyStyle = "text-blue-500 font-bold dark:text-blue-300";
    const valStyle = "text-yellow-500 dark:text-yellow-300";
    const unitStyle = "text-blue-500 dark:text-blue-300";

    return {
        name: {
            value: attribute.field.name,
            class: keyStyle,
        },
        value: {
            value: attribute.field.value.value.toString(),
            class: valStyle,
        },
        unit: {
            value: attribute.unit ?? "",
            class: unitStyle,
        },
    };
}

export interface ResourceTableItem {
    id: bigint;
    idString: string;
    parent: string;
    kind: string;
    total: DurationWithStyle;
    type: string;
    visibilityIcon: string;
    location: string;
    attributes: Array<FormattedAttribute>;
    class?: string;
}

export function toResourceTableItem(
    resource: TokioResource,
    lastUpdatedAt: Timestamp,
): ResourceTableItem {
    return {
        id: resource.id,
        idString: resource.spanId?.toString() ?? "",
        parent: resource.parent,
        kind: resource.kind,
        total: getDurationWithClass(resource.totalDuration(lastUpdatedAt)),
        type: resource.concreteType,
        visibilityIcon:
            resource.visibility === Visibility.Internal
                ? "i-heroicons-lock-closed"
                : "i-heroicons-eye",
        location: resource.location,
        attributes: resource.stats.attributes.map(makeFormattedAttribute),
        class: resource.isDropped()
            ? "bg-slate-50 dark:bg-slate-950 animate-pulse"
            : undefined,
    };
}
