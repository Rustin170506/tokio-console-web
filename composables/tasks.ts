import { ConnectError } from "@connectrpc/connect";
import {
    type FormattedField,
    TokioTask,
    TaskState,
    formatLocation,
} from "./task/tokioTask";
import type { DurationWithStyle } from "./durationWithStyle";
import { Duration, Timestamp } from "./task/duration";
import { fromProtoTaskStats } from "./task/tokioTaskStats";
import {
    fromProtoTaskDetails,
    type TokioTaskDetails,
} from "./task/tokioTaskDetails";
import { Metadata } from "~/gen/common_pb";
import {
    InstrumentRequest,
    TaskDetailsRequest,
    type Update,
} from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";

export interface TaskTableItem {
    id: bigint;
    idString: string;
    name: string;
    state: string;
    total: DurationWithStyle;
    busy: DurationWithStyle;
    sched: DurationWithStyle;
    idle: DurationWithStyle;
    pools: bigint;
    kind: string;
    location: string;
    fields: Array<FormattedField>;
    class?: string;
}

export function toTaskTableItem(task: TokioTask): TaskTableItem {
    return {
        id: task.id,
        idString: task.taskId?.toString() ?? "",
        name: task.name ?? "",
        state: getTaskStateIconName(task.state()),
        total: getDurationWithClass(task.totalDuration(Timestamp.now())),
        busy: getDurationWithClass(task.busyDuration(Timestamp.now())),
        sched: getDurationWithClass(task.scheduledDuration(Timestamp.now())),
        idle: getDurationWithClass(task.idleDuration(Timestamp.now())),
        pools: task.stats.polls,
        kind: task.kind,
        location: task.location,
        fields: task.formattedFields,
        class:
            task.state() === TaskState.Completed
                ? "bg-slate-50 dark:bg-slate-950 animate-pulse"
                : undefined,
    };
}

function getTaskStateIconName(state: TaskState): string {
    switch (state) {
        case TaskState.Running:
            return "i-heroicons-play";
        case TaskState.Scheduled:
            return "i-heroicons-arrow-small-up";
        case TaskState.Idle:
            return "i-heroicons-pause";
        case TaskState.Completed:
            return "i-heroicons-stop";
        default:
            throw new Error("unreachable");
    }
}

// Metadata about a task.
const metas: Map<bigint, Metadata> = new Map();

const ids = {
    nextId: 1n,
    map: new Map(),
};

// How long to retain tasks after they're dropped.
// TODO: make this configurable.
const retainFor = new Duration(6n, 0); // 6 seconds

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

        const meta = metas.get(metaId);
        if (!meta) {
            continue;
        }

        let name;
        let taskId;
        let kind = "";
        const targetField = {
            name: "target",
            value: meta.target,
        };

        const fields: FormattedField[] = [];
        for (let i = 0; i < task.fields.length; i++) {
            // TODO: validate fields.
            const field = task.fields[i];
            // the `task.name` field gets its own column, if it's present.
            switch (field.name.value) {
                case "task.name":
                    name = field.value.value!.toString();
                    break;
                case "task.id":
                    taskId =
                        field.value?.case === "u64Val"
                            ? field.value?.value
                            : undefined;
                    break;
                case "kind":
                    kind = field.value.value!.toString();
                    break;
                default:
                    fields.push({
                        name: field.name.value!.toString(),
                        value: field.value.value!.toString(),
                    });
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

        let id = ids.map.get(spanId);
        if (!id) {
            const newID = ids.nextId++;
            ids.map.set(spanId, newID);
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

// TODO: find a better way to share this between composables.
// Then we can spilt different composables into different files.
const tasksData = ref<Map<bigint, TokioTask>>(new Map());

let updateStreamInstance: AsyncIterable<Update> | null = null;

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

let isTaskStarted = false;

export function useTasks() {
    if (isTaskStarted) {
        return {
            pending: ref<boolean>(false),
            tasksData,
        };
    }

    const pending = ref<boolean>(true);

    const addTasks = (update: Update) => {
        if (update.newMetadata) {
            update.newMetadata.metadata.forEach((meta) => {
                const id = meta.id?.id;
                const metadata = meta.metadata;
                if (id && metadata) {
                    metas.set(id, metadata);
                }
            });
        }
        if (update.taskUpdate) {
            const tasks = taskUpdateToTasks(update.taskUpdate);

            for (const task of tasks) {
                tasksData.value.set(task.id, task);
            }

            for (const k in update.taskUpdate.statsUpdate) {
                const task = tasksData.value.get(ids.map.get(BigInt(k)));
                if (task) {
                    task.stats = fromProtoTaskStats(
                        update.taskUpdate.statsUpdate[k],
                    );
                    tasksData.value.set(task.id, task);
                }
            }
        }
    };

    const retainTasks = (retainFor: Duration) => {
        const newTasks = new Map<bigint, TokioTask>();
        for (const [id, task] of tasksData.value) {
            if (task.stats.droppedAt) {
                if (
                    !Timestamp.now()
                        .subtract(task.stats.droppedAt)
                        .greaterThan(retainFor)
                ) {
                    newTasks.set(id, task);
                }
            } else {
                newTasks.set(id, task);
            }
        }

        tasksData.value = newTasks;
    };

    const getUpdateStream = () => {
        if (!updateStreamInstance) {
            const client = useGrpcClient();
            updateStreamInstance = client.watchUpdates(new InstrumentRequest());
        }
        return updateStreamInstance;
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
                retainTasks(retainFor);
            }
        } catch (err) {
            handleConnectError(err);
        } finally {
            pending.value = false;
        }
    };

    const startWatchTaskUpdates = () => {
        if (!isTaskStarted) {
            watchForUpdates();
            isTaskStarted = true;
        }
    };

    startWatchTaskUpdates();

    return {
        pending,
        tasksData,
    };
}

export interface TaskBasicInfo extends TaskTableItem {
    busyPercentage: string;
    scheduledPercentage: string;
    idlePercentage: string;
    wakes: bigint;
    wakerClones: bigint;
    wakerDrops: bigint;
    lastWake?: Timestamp;
    selfWakes: bigint;
    wakerCount: bigint;
    lastWokenDuration?: DurationWithStyle;
}

export function toTaskBasicInfo(task: TokioTask): TaskBasicInfo {
    const stats = task.stats;
    const taskTableItemData = toTaskTableItem(task);
    return {
        ...taskTableItemData,
        busyPercentage: formatPercentage(
            task.durationPercent(taskTableItemData.busy.value),
        ),
        scheduledPercentage: formatPercentage(
            task.durationPercent(taskTableItemData.sched.value),
        ),
        idlePercentage: formatPercentage(
            task.durationPercent(taskTableItemData.idle.value),
        ),
        wakes: stats.wakes,
        wakerClones: stats.wakerClones,
        wakerDrops: stats.wakerDrops,
        lastWake: stats.lastWake,
        selfWakes: stats.selfWakes,
        wakerCount: task.wakerCount(),
        lastWokenDuration: task.lastWakeDuration()
            ? getDurationWithClass(task.lastWakeDuration()!)
            : undefined,
    };
}

function formatPercentage(value: number): string {
    return value.toFixed(2) + "%";
}

export interface TaskDetails {
    pollTimes: {
        percentiles: {
            percentile: string;
            duration: DurationWithStyle;
        }[];
    };
}

export function toTaskDetails(details: TokioTaskDetails): TaskDetails {
    const percentiles = details.pollTimes.percentiles.map((p) => {
        return {
            percentile: `p${p.percentile}`,
            duration: getDurationWithClass(p.duration),
        };
    });

    return {
        pollTimes: {
            percentiles,
        },
    };
}

export function useTaskDetails(id: bigint) {
    const pending = ref<boolean>(true);
    const task = tasksData.value.get(id);
    const taskDetails = ref<TokioTaskDetails>({
        pollTimes: {
            percentiles: [],
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

    return { pending, task, taskDetails };
}
