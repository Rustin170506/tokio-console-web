import { ConnectError } from "@connectrpc/connect";
import {
    type FormattedField,
    TokioTask,
    TaskState,
    formatLocation,
} from "../types/task/tokioTask";
import { Duration, Timestamp } from "../types/task/duration";
import { fromProtoTaskStats } from "../types/task/tokioTaskStats";
import {
    fromProtoTaskDetails,
    type DurationDetails,
    type TokioTaskDetails,
    type DurationCount,
    type Percentile,
} from "../types/task/tokioTaskDetails";
import type { DurationWithStyle } from "./durationWithStyle";
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

export function toTaskTableItem(
    task: TokioTask,
    lastUpdatedAt: Timestamp,
): TaskTableItem {
    return {
        id: task.id,
        idString: task.taskId?.toString() ?? "",
        name: task.name ?? "",
        state: getTaskStateIconName(task.state()),
        total: getDurationWithClass(task.totalDuration(lastUpdatedAt)),
        busy: getDurationWithClass(task.busyDuration(lastUpdatedAt)),
        sched: getDurationWithClass(task.scheduledDuration(lastUpdatedAt)),
        idle: getDurationWithClass(task.idleDuration(lastUpdatedAt)),
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

interface State {
    // Metadata about a task.
    metas: Map<bigint, Metadata>;
    // IDs for tasks.
    ids: {
        nextId: bigint;
        map: Map<bigint, bigint>;
    };
    // How long to retain tasks after they're dropped.
    retainFor: Duration;
    tasks: Ref<Map<bigint, TokioTask>>;
    lastUpdatedAt: Ref<Timestamp | undefined>;
    isTaskStarted: boolean;
    updateStreamInstance?: AsyncIterable<Update>;
}

const state: State = {
    metas: new Map(),
    ids: {
        nextId: 1n,
        map: new Map(),
    },
    // TODO: make this configurable.
    retainFor: new Duration(6n, 0),
    tasks: ref<Map<bigint, TokioTask>>(new Map()),
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isTaskStarted: false,
};

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

let isTaskStarted = false;

export function useTasks() {
    if (isTaskStarted) {
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
                const metadata = meta.metadata;
                if (id && metadata) {
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
        if (!isTaskStarted) {
            watchForUpdates();
            isTaskStarted = true;
        }
    };

    startWatchTaskUpdates();

    return {
        pending,
        tasksData: state.tasks,
        lastUpdatedAt: state.lastUpdatedAt,
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

export function toTaskBasicInfo(
    task: TokioTask,
    lastUpdatedAt: Timestamp,
): TaskBasicInfo {
    const stats = task.stats;
    const taskTableItemData = toTaskTableItem(task, lastUpdatedAt);
    return {
        ...taskTableItemData,
        busyPercentage: formatPercentage(
            task.durationPercent(lastUpdatedAt, taskTableItemData.busy.value),
        ),
        scheduledPercentage: formatPercentage(
            task.durationPercent(lastUpdatedAt, taskTableItemData.sched.value),
        ),
        idlePercentage: formatPercentage(
            task.durationPercent(lastUpdatedAt, taskTableItemData.idle.value),
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

export interface TimesDetails {
    percentiles: {
        percentile: string;
        duration: DurationWithStyle;
    }[];
    histogram: {
        duration: Duration;
        count: number;
    }[];
    min?: DurationWithStyle;
    max?: DurationWithStyle;
}

export interface TaskDetails {
    pollTimes: TimesDetails;
    scheduledTimes?: TimesDetails;
}

function mapPercentiles(percentiles: Percentile[]) {
    return percentiles.map((p) => {
        return {
            percentile: `p${p.percentile}`,
            duration: getDurationWithClass(p.duration),
        };
    });
}

function mapHistogram(histogram: DurationCount[]) {
    return histogram.map((h) => {
        return {
            duration: h.duration,
            count: Number(h.count),
        };
    });
}

function mapTimes(times: DurationDetails): TimesDetails {
    return {
        percentiles: mapPercentiles(times.percentiles),
        histogram: mapHistogram(times.histogram),
        min: getDurationWithClass(times.min),
        max: getDurationWithClass(times.max),
    };
}

export function toTaskDetails(details: TokioTaskDetails): TaskDetails {
    const pollTimes = mapTimes(details.pollTimes);
    const scheduledTimes = details.scheduledTimes
        ? mapTimes(details.scheduledTimes)
        : undefined;

    return {
        pollTimes,
        scheduledTimes,
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
