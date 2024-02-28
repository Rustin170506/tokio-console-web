import type { Timestamp } from "./common/duration";
import type { TokioResource } from "./resource/tokioResource";
import {
    toResourceTableItem,
    type ResourceTableItem,
} from "./resourceTableItem";

export interface ResourceBasicInfo extends ResourceTableItem {
    target: string;
}

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
