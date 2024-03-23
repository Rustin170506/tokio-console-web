import type { Timestamp } from "./common/duration";
import type { TokioResource } from "./resource/tokioResource";
import {
    toResourceTableItem,
    type ResourceTableItem,
} from "./resourceTableItem";

export interface ResourceBasicInfo extends ResourceTableItem {
    target: string;
}

/**
 * Convert a resource to a resource basic info.
 * Only adds the target to the resource table item.
 * @param resource - The resource to convert.
 * @param lastUpdatedAt - The last time the resource was updated.
 * @returns
 */
export function toResourceBasicInfo(
    resource: TokioResource,
    lastUpdatedAt: Timestamp,
): ResourceBasicInfo {
    const resourceTableItemData = toResourceTableItem(resource, lastUpdatedAt);
    return {
        ...resourceTableItemData,
        target: resource.target,
    };
}
