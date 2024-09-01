// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=ts"
// @generated from file instrument.proto (package rs.tokio.console.instrument, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { InstrumentRequest, PauseRequest, PauseResponse, ResumeRequest, ResumeResponse, TaskDetailsRequest, Update } from "./instrument_pb.js";
import { MethodKind } from "@bufbuild/protobuf";
import { TaskDetails } from "./tasks_pb.js";

/**
 * `InstrumentServer<T>` implements `Instrument` as a service.
 *
 * @generated from service rs.tokio.console.instrument.Instrument
 */
export const Instrument = {
  typeName: "rs.tokio.console.instrument.Instrument",
  methods: {
    /**
     * Produces a stream of updates representing the behavior of the instrumented async runtime.
     *
     * @generated from rpc rs.tokio.console.instrument.Instrument.WatchUpdates
     */
    watchUpdates: {
      name: "WatchUpdates",
      I: InstrumentRequest,
      O: Update,
      kind: MethodKind.ServerStreaming,
    },
    /**
     * Produces a stream of updates describing the activity of a specific task.
     *
     * @generated from rpc rs.tokio.console.instrument.Instrument.WatchTaskDetails
     */
    watchTaskDetails: {
      name: "WatchTaskDetails",
      I: TaskDetailsRequest,
      O: TaskDetails,
      kind: MethodKind.ServerStreaming,
    },
    /**
     * Registers that the console observer wants to pause the stream.
     *
     * @generated from rpc rs.tokio.console.instrument.Instrument.Pause
     */
    pause: {
      name: "Pause",
      I: PauseRequest,
      O: PauseResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Registers that the console observer wants to resume the stream.
     *
     * @generated from rpc rs.tokio.console.instrument.Instrument.Resume
     */
    resume: {
      name: "Resume",
      I: ResumeRequest,
      O: ResumeResponse,
      kind: MethodKind.Unary,
    },
  }
} as const;

