import { ConnectError } from "@connectrpc/connect";
import { state } from "./state";
import {
    FieldValue,
    Field,
    formatLocation,
    FieldValueType,
} from "~/types/common/field";
import { TokioTask } from "~/types/task/tokioTask";
import { Duration, Timestamp } from "~/types/common/duration";
import { fromProtoTaskStats } from "~/types/task/tokioTaskStats";
import {
    fromProtoTaskDetails,
    type TokioTaskDetails,
} from "~/types/task/tokioTaskDetails";
import {
    InstrumentRequest,
    TaskDetailsRequest,
    type Update,
} from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";
import { fromProtoMetadata } from "~/types/common/metadata";

const taskUpdateToTasks = (update: TaskUpdate): TokioTask[] => {
    const result = new Array<TokioTask>();
    const tasks = update.newTasks;
    const statsUpdate = update.statsUpdate;

    for (const task of tasks) {
        if (!task.id) {
            continue;
        }
        let metaId;
        if (task.metadata) {
            metaId = task.metadata.id;
        } else {
            continue;
        }

        const meta = state.metas.get(metaId);
        if (!meta) {
            continue;
        }

        let name;
        let taskId: bigint | undefined;
        let kind = "";
        const targetField = new Field(
            "target",
            new FieldValue(FieldValueType.Str, meta.target),
        );

        const fields: Field[] = [];
        for (let i = 0; i < task.fields.length; i++) {
            const field = Field.fromProto(task.fields[i], meta);
            if (!field) {
                continue;
            }
            // the `task.name` field gets its own column, if it's present.
            switch (field.name) {
                case Field.NAME:
                    name = field.value.value!.toString();
                    break;
                case Field.TASK_ID:
                    taskId =
                        field.value?.type === FieldValueType.U64
                            ? (field.value?.value as bigint)
                            : undefined;
                    break;
                case Field.KIND:
                    kind = field.value.value!.toString();
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

        let id = state.ids.map.get(spanId);
        if (!id) {
            const newID = state.ids.nextId++;
            state.ids.map.set(spanId, newID);
            id = newID;
        }
        let shortDesc = "";
        if (taskId && name) {
            shortDesc = `${taskId} (${name})`;
        } else if (taskId) {
            shortDesc = taskId.toString();
        } else if (name) {
            shortDesc = name;
        }
        const location = formatLocation(task.location);

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
        result.push(t);
    }

    return result;
};

const handleConnectError = (err: any) => {
    const toast = useToast();

    if (err instanceof ConnectError) {
        toast.add({
            title: err.name,
            description: err.rawMessage,
            color: "red",
        });
    }
};

export function useTasks() {
    if (state.isConnected) {
        return {
            pending: ref<boolean>(false),
            tasksData: state.tasks,
            lastUpdatedAt: state.lastUpdatedAt,
        };
    }

    const pending = ref<boolean>(true);

    const addTasks = (update: Update) => {
        if (update.now !== undefined) {
            state.lastUpdatedAt.value = new Timestamp(
                update.now.seconds,
                update.now.nanos,
            );
        }

        if (update.newMetadata) {
            update.newMetadata.metadata.forEach((meta) => {
                const id = meta.id?.id;
                if (id && meta.metadata) {
                    const metadata = fromProtoMetadata(meta.metadata, id);
                    state.metas.set(id, metadata);
                }
            });
        }
        if (update.taskUpdate) {
            const tasks = taskUpdateToTasks(update.taskUpdate);

            for (const task of tasks) {
                state.tasks.value.set(task.id, task);
            }

            for (const k in update.taskUpdate.statsUpdate) {
                const task = state.tasks.value.get(
                    state.ids.map.get(BigInt(k))!,
                );
                if (task) {
                    task.stats = fromProtoTaskStats(
                        update.taskUpdate.statsUpdate[k],
                    );
                    state.tasks.value.set(task.id, task);
                }
            }
        }
    };

    const retainTasks = (retainFor: Duration) => {
        const newTasks = new Map<bigint, TokioTask>();
        for (const [id, task] of state.tasks.value) {
            if (task.stats.droppedAt) {
                if (
                    state.lastUpdatedAt.value !== undefined &&
                    !state.lastUpdatedAt.value
                        .subtract(task.stats.droppedAt)
                        .greaterThan(retainFor)
                ) {
                    newTasks.set(id, task);
                }
            } else {
                newTasks.set(id, task);
            }
        }

        state.tasks.value = newTasks;
    };

    const getUpdateStream = () => {
        if (!state.updateStreamInstance) {
            const client = useGrpcClient();
            state.updateStreamInstance = client.watchUpdates(
                new InstrumentRequest(),
            );
        }
        return state.updateStreamInstance;
    };

    // Async function to watch for updates.
    const watchForUpdates = async () => {
        try {
            const updateStream = getUpdateStream();

            for await (const value of updateStream) {
                if (pending.value) {
                    pending.value = false;
                }
                addTasks(value);
                retainTasks(state.retainFor);
            }
        } catch (err) {
            handleConnectError(err);
        } finally {
            pending.value = false;
        }
    };

    const startWatchTaskUpdates = () => {
        if (!state.isConnected) {
            watchForUpdates();
            state.isConnected = true;
        }
    };

    startWatchTaskUpdates();

    return {
        pending,
        tasksData: state.tasks,
        lastUpdatedAt: state.lastUpdatedAt,
    };
}

export function useTaskDetails(id: bigint) {
    const pending = ref<boolean>(true);
    const task = state.tasks.value.get(id);
    const taskDetails = ref<TokioTaskDetails>({
        pollTimes: {
            percentiles: [],
            histogram: [],
            max: new Duration(0n, 0),
            min: new Duration(0n, 0),
        },
    });

    // Async function to watch for details.
    const watchForDetails = async () => {
        try {
            const client = useGrpcClient();
            const detailsStream = client.watchTaskDetails(
                new TaskDetailsRequest({
                    id: {
                        id: task!.spanId,
                    },
                }),
            );

            for await (const value of detailsStream) {
                if (pending.value) {
                    pending.value = false;
                }
                taskDetails.value = fromProtoTaskDetails(value);
            }
        } catch (err) {
            handleConnectError(err);
        } finally {
            pending.value = false;
        }
    };

    if (task) {
        watchForDetails();
    }

    return { pending, task, taskDetails, lastUpdatedAt: state.lastUpdatedAt };
}
