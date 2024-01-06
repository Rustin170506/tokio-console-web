import { Metadata as ProtoMetadata } from "~/gen/common_pb";

export interface Metadata {
    id: bigint;
    target: string;
    field_names: string[];
}

export function fromProtoMetadata(meta: ProtoMetadata, id: bigint): Metadata {
    return {
        id,
        field_names: meta.fieldNames,
        target: meta.target,
    };
}
