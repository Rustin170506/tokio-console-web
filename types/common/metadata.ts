import { Metadata as ProtoMetadata } from "~/gen/common_pb";

export interface Metadata {
    id: bigint;
    target: string;
    fieldNames: string[];
}

export function fromProtoMetadata(meta: ProtoMetadata, id: bigint): Metadata {
    const { fieldNames, target } = meta;

    return {
        id,
        fieldNames,
        target,
    };
}
