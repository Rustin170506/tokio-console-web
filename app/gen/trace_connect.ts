// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=ts"
// @generated from file trace.proto (package rs.tokio.console.trace, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { TraceEvent, WatchRequest } from "./trace_pb.js";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * Allows observers to stream trace events for a given `WatchRequest` filter.
 *
 * @generated from service rs.tokio.console.trace.Trace
 */
export const Trace = {
  typeName: "rs.tokio.console.trace.Trace",
  methods: {
    /**
     * Produces a stream of trace events for the given filter.
     *
     * @generated from rpc rs.tokio.console.trace.Trace.Watch
     */
    watch: {
      name: "Watch",
      I: WatchRequest,
      O: TraceEvent,
      kind: MethodKind.ServerStreaming,
    },
  }
} as const;

