import { consola } from "consola";
import { Duration, Timestamp } from "~/types/common/duration";
import type { Metadata } from "~/types/common/metadata";
import type { TokioResource } from "~/types/resource/tokioResource";
import type { AsyncOp } from "~/types/asyncOp/asyncOp";
import { NeverYielded } from "~/types/warning/taskWarnings/neverYielded";
import {
    FieldValue,
    Field,
    formatLocation,
    FieldValueType,
} from "~/types/common/field";
import { TaskLintResult, TokioTask } from "~/types/task/tokioTask";
import { fromProtoTaskStats } from "~/types/task/tokioTaskStats";
import { type Update } from "~/gen/instrument_pb";
import type { TaskUpdate } from "~/gen/tasks_pb";
import type { Linter } from "~/types/warning/warn";

export class Ids {
    nextId: bigint;
    map: Map<bigint, bigint>;

    constructor() {
        this.nextId = 1n;
        this.map = new Map();
    }

    idFor(spanId: bigint): bigint {
        let id = this.map.get(spanId);
        if (!id) {
            id = this.nextId++;
            this.map.set(spanId, id);
        }
        return id;
    }
}

export class Store<T> {
    items: Ref<Map<bigint, T>>;
    ids: Ids;

    constructor() {
        this.items = ref(new Map());
        this.ids = new Ids();
    }

    idFor(spanId: bigint): bigint {
        return this.ids.idFor(spanId);
    }

    getBySpanId(spanId: bigint): T | undefined {
        const id = this.ids.map.get(spanId);
        return this.items.value.get(id!);
    }
}

// The state of tasks.
export class TaskState {
    tasks: Store<TokioTask>;
    // The set of tasks that are pending linting.
    pendingLints: Set<bigint>;
    // The linters to run on tasks.
    linters: Array<Linter<TokioTask>>;

    constructor(...linters: Array<Linter<TokioTask>>) {
        this.tasks = new Store();
        this.pendingLints = new Set();
        this.linters = linters;
    }

    /**
     * Convert a TaskUpdate to an array of TokioTask.
     * @param update - The update from the server.
     * @param metas - The metadata for the tasks.
     * @returns An array of TokioTask and a set of pending lints.
     */
    taskUpdateToTasks(
        update: TaskUpdate,
        metas: Map<bigint, Metadata>,
    ): [TokioTask[], Set<bigint>] {
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

            const meta = metas.get(metaId);
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

            const id = this.tasks.idFor(spanId);
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
            if (t.lint(this.linters) === TaskLintResult.RequiresRecheck) {
                nextPendingLint.add(t.id);
            }
            result.push(t);
        }

        return [result, nextPendingLint];
    }

    /**
     * Add tasks to the state.
     * @param update - The update from the server.
     * @param metas - The metadata for the tasks.
     */
    addTasks(update: Update, metas: Map<bigint, Metadata>) {
        if (!update.taskUpdate) {
            return;
        }

        const nextPendingLints: Set<bigint> = new Set();
        const [tasks, pendingLints] = this.taskUpdateToTasks(
            update.taskUpdate,
            metas,
        );
        pendingLints.forEach((lint) => nextPendingLints.add(lint));

        tasks.forEach((task) => {
            this.tasks.items.value.set(task.id, task);
        });

        for (const k in update.taskUpdate.statsUpdate) {
            const id = this.tasks.idFor(BigInt(k));
            const task = this.tasks.items.value.get(id);
            if (task) {
                task.stats = fromProtoTaskStats(
                    update.taskUpdate.statsUpdate[k],
                );
                this.tasks.items.value.set(task.id, task);
                const lintResult = task.lint(this.linters);
                if (lintResult === TaskLintResult.RequiresRecheck) {
                    nextPendingLints.add(task.id);
                } else {
                    // Avoid linting this task again this cycle.
                    nextPendingLints.delete(task.id);
                }
            }
        }

        this.pendingLints.forEach((id) => {
            const task = this.tasks.items.value.get(id);
            if (task) {
                if (
                    task.lint(this.linters) === TaskLintResult.RequiresRecheck
                ) {
                    nextPendingLints.add(task.id);
                }
            }
        });

        this.pendingLints = nextPendingLints;
    }

    /**
     * Retain tasks for a given duration.
     * @param retainFor - The duration to retain the tasks for.
     * @param lastUpdatedAt - The last time the tasks were updated.
     */
    retainTasks(
        retainFor: Duration,
        lastUpdatedAt: Ref<Timestamp | undefined>,
    ) {
        const newTasks = new Map<bigint, TokioTask>();
        for (const [id, task] of this.tasks.items.value) {
            const shouldRetain =
                !task.stats.droppedAt ||
                lastUpdatedAt.value
                    ?.subtract(task.stats.droppedAt)
                    .greaterThan(retainFor) === false;
            if (shouldRetain) {
                newTasks.set(id, task);
            }
        }
        this.tasks.items.value = newTasks;
    }
}

export interface State {
    // Metadata about a task.
    metas: Map<bigint, Metadata>;
    // How long to retain tasks after they're dropped.
    retainFor: Duration;
    taskState: TaskState;
    resources: Store<TokioResource>;
    asyncOps: Store<AsyncOp>;
    lastUpdatedAt: Ref<Timestamp | undefined>;
    isUpdateWatched: boolean;
}

export const state: State = {
    metas: new Map(),
    // TODO: make this configurable.
    retainFor: new Duration(6n, 0),
    // TODO: make this configurable.
    taskState: new TaskState(new NeverYielded()),
    resources: new Store(),
    asyncOps: new Store(),
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isUpdateWatched: false,
};
