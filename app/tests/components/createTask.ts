import { Timestamp, Duration } from "~/types/common/duration";
import { Field, FieldValue, FieldValueType } from "~/types/common/field";
import { TokioTask } from "~/types/task/tokioTask";

export function createTask(): TokioTask {
    const formattedFields = [
        new Field("target", new FieldValue(FieldValueType.Str, "tokio:task")),
    ];
    const stats = {
        polls: 100n,
        createdAt: new Duration(1000n, 0),
        busy: new Duration(500n, 0),
        scheduled: new Duration(300n, 0),
        // Use relative times to avoid test flakiness.
        lastPollStarted: new Duration(1000n, 0),
        lastPollEnded: new Timestamp(0n, 0),
        idle: new Duration(200n, 0),
        wakes: 1n,
        wakerClones: 1n,
        wakerDrops: 1n,
        selfWakes: 1n,
        lastWake: new Timestamp(1000n, 0),
    };

    return new TokioTask(
        2n,
        1n,
        1n,
        "some task",
        formattedFields,
        stats,
        "tokio:task",
        "task1",
        "app.rs/68:10",
        "task",
    );
}
