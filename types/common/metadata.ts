import { Metadata as ProtoMetadata } from "~/gen/common_pb";

export interface Metadata {
    id: bigint;
    target: string;
    fieldNames: string[];
}

export function fromProtoMetadata(meta: ProtoMetadata, id: bigint): Metadata {
    return {
        id,
        fieldNames: meta.fieldNames,
        target: meta.target,
    };
}
