import { consola } from "consola";
import { state } from "./state";
import { TokioTask } from "~/types/task/tokioTask";
import { Duration } from "~/types/common/duration";
import {
    fromProtoTaskDetails,
    type TokioTaskDetails,
} from "~/types/task/tokioTaskDetails";
import { TaskDetailsRequest } from "~/gen/instrument_pb";

/**
 * useTasks is a composable function that returns the tasks data and a pending
 * state. It also starts a watch for updates if it hasn't already been started.
 */
export function useTasks() {
    const { isUpdatePending, lastUpdatedAt, taskState, isWatchStarted } = state;
    const pending = isUpdatePending;
    // Async function to watch for updates.
    if (!isWatchStarted) {
        watchForUpdates();
    }
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
    const task = state.taskState.tasks.getById(id);
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
            const client = useGrpcClient();
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
