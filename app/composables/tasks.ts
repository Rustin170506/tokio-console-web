import { consola } from "consola";
import { state } from "./state";
import {
    FieldValue,
    Field,
    formatLocation,
    FieldValueType,
} from "~/types/common/field";
import { TaskLintResult, TokioTask } from "~/types/task/tokioTask";
import { Duration } from "~/types/common/duration";
import { fromProtoTaskStats } from "~/types/task/tokioTaskStats";
import {
    fromProtoTaskDetails,
    type TokioTaskDetails,
} from "~/types/task/tokioTaskDetails";
import { TaskDetailsRequest, type Update } from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";

/**
 * Convert a TaskUpdate to an array of TokioTask.
 * @param update - The update from the server.
 * @returns An array of TokioTask.
 */
const taskUpdateToTasks = (update: TaskUpdate): [TokioTask[], Set<bigint>] => {
    const nextPendingLint = new Set<bigint>();
    const result = new Array<TokioTask>();
    const { newTasks: tasks, statsUpdate } = update;

    for (const task of tasks) {
        if (!task.id) {
            consola.warn("skipping task with no id", task);
            continue;
        }
        let metaId;
        if (task.metadata) {
            metaId = task.metadata.id;
        } else {
            consola.warn("task has no metadata id, skipping", task);
            continue;
        }

        const meta = state.metas.get(metaId);
        if (!meta) {
            consola.warn("no metadata for task, skipping", task);
            continue;
        }

        let name;
        let taskId: bigint | undefined;
        let kind = "";
        const targetField = new Field(
            "target",
            new FieldValue(FieldValueType.Str, meta.target),
        );

        const fields = [];
        for (let i = 0; i < task.fields.length; i++) {
            const field = Field.fromProto(task.fields[i], meta);
            if (!field) {
                continue;
            }
            // the `task.name` field gets its own column, if it's present.
            switch (field.name) {
                case Field.NAME:
                    name = field.value.value.toString();
                    break;
                case Field.TASK_ID:
                    taskId =
                        field.value.type === FieldValueType.U64
                            ? (field.value.value as bigint)
                            : undefined;
                    break;
                case Field.KIND:
                    kind = field.value.value.toString();
                    break;
                default:
                    fields.push(field);
                    break;
            }
        }
        fields.push(targetField);

        const spanId = task.id.id;
        const stats = statsUpdate[spanId.toString()];
        if (!stats) {
            continue;
        }
        // Delete
        delete statsUpdate[spanId.toString()];
        const taskStats = fromProtoTaskStats(stats);
        const location = formatLocation(task.location);

        const id = state.taskState.tasks.idFor(spanId);
        let shortDesc = "";
        if (taskId && name) {
            shortDesc = `${taskId} (${name})`;
        } else if (taskId) {
            shortDesc = taskId.toString();
        } else if (name) {
            shortDesc = name;
        }

        const t: TokioTask = new TokioTask(
            id,
            taskId,
            spanId,
            shortDesc,
            fields,
            taskStats,
            meta.target,
            name,
            location,
            kind,
        );
        if (
            t.lint(state.taskState.linters) === TaskLintResult.RequiresRecheck
        ) {
            nextPendingLint.add(t.id);
        }
        result.push(t);
    }

    return [result, nextPendingLint];
};

/**
 * Add tasks to the state.
 * @param update - The update from the server.
 */
export function addTasks(update: Update) {
    if (!update.taskUpdate) {
        return;
    }

    const nextPendingLints: Set<bigint> = new Set();
    const [tasks, pendingLints] = taskUpdateToTasks(update.taskUpdate);
    pendingLints.forEach((lint) => nextPendingLints.add(lint));

    tasks.forEach((task) => {
        state.taskState.tasks.items.value.set(task.id, task);
    });

    for (const k in update.taskUpdate.statsUpdate) {
        const id = state.taskState.tasks.idFor(BigInt(k));
        const task = state.taskState.tasks.items.value.get(id);
        if (task) {
            task.stats = fromProtoTaskStats(update.taskUpdate.statsUpdate[k]);
            state.taskState.tasks.items.value.set(task.id, task);
            const lintResult = task.lint(state.taskState.linters);
            if (lintResult === TaskLintResult.RequiresRecheck) {
                nextPendingLints.add(task.id);
            } else {
                // Avoid linting this task again this cycle.
                nextPendingLints.delete(task.id);
            }
        }
    }

    state.taskState.pendingLints.forEach((id) => {
        const task = state.taskState.tasks.items.value.get(id);
        if (task) {
            if (
                task.lint(state.taskState.linters) ===
                TaskLintResult.RequiresRecheck
            ) {
                nextPendingLints.add(task.id);
            }
        }
    });

    state.taskState.pendingLints = nextPendingLints;
}

/**
 * Retain tasks for a given duration.
 * @param retainFor - The duration to retain the tasks for.
 */
export function retainTasks(retainFor: Duration) {
    const newTasks = new Map<bigint, TokioTask>();
    for (const [id, task] of state.taskState.tasks.items.value) {
        const shouldRetain =
            !task.stats.droppedAt ||
            state.lastUpdatedAt.value
                ?.subtract(task.stats.droppedAt)
                .greaterThan(retainFor) === false;
        if (shouldRetain) {
            newTasks.set(id, task);
        }
    }
    state.taskState.tasks.items.value = newTasks;
}

/**
 * useTasks is a composable function that returns the tasks data and a pending
 * state. It also starts a watch for updates if it hasn't already been started.
 */
export function useTasks() {
    const { isUpdateWatched, lastUpdatedAt, taskState } = state;

    if (isUpdateWatched) {
        return {
            pending: ref<boolean>(false),
            tasksData: taskState.tasks.items,
            lastUpdatedAt,
        };
    }

    const pending = ref<boolean>(true);
    // Async function to watch for updates.
    watchForUpdates(pending);
    return {
        pending,
        tasksData: taskState.tasks.items,
        lastUpdatedAt,
    };
}

/**
 * Get the task details for a given task id.
 * @param id - The id of the task to get details for.
 * @param width - The width of the details chart. This is used to deserialize the histogram.
 * @returns An object with the pending state, the task, the task details, the last updated at time, and a closed state.
 */
export function useTaskDetails(id: bigint, width: Ref<number>) {
    const pending = ref(true);
    const task = state.taskState.tasks.items.value.get(id);
    const taskDetails: Ref<TokioTaskDetails> = ref({
        pollTimes: {
            percentiles: [],
            histogram: [],
            max: new Duration(0n, 0),
            min: new Duration(0n, 0),
        },
    });
    const closed = ref(false);
    const { lastUpdatedAt } = state;

    // Async function to watch for details.
    const watchForDetails = async ({ spanId }: TokioTask) => {
        try {
            const client = await grpcClient();
            const abort = new AbortController();
            const detailsStream = client.watchTaskDetails(
                new TaskDetailsRequest({
                    id: {
                        id: spanId,
                    },
                }),
                {
                    signal: abort.signal,
                },
            );

            for await (const value of detailsStream) {
                if (pending.value) {
                    pending.value = false;
                }
                // This means the task details page has been closed.
                if (closed.value) {
                    abort.abort();
                    break;
                }
                taskDetails.value = fromProtoTaskDetails(value, width.value);
            }
        } catch (err) {
            handleConnectError(err);
        } finally {
            pending.value = false;
        }
    };

    if (task) {
        watchForDetails(task);
    } else {
        consola.warn("task not found", id);
    }

    return {
        pending,
        task,
        taskDetails,
        lastUpdatedAt,
        closed,
    };
}
