import { consola } from "consola";
import { Duration, Timestamp } from "~/types/common/duration";
import type { Metadata } from "~/types/common/metadata";
import {
    kindFromProto,
    TokioResource,
    Visibility,
} from "~/types/resource/tokioResource";
import { AsyncOp } from "~/types/asyncOp/asyncOp";
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
import type { ResourceUpdate } from "~/gen/resources_pb";
import { fromProtoResourceStats } from "~/types/resource/tokioResourceStats";
import type { AsyncOpUpdate } from "~/gen/async_ops_pb";
import { fromProtoAsyncOpStats } from "~/types/asyncOp/asyncOpStats";
import { LostWaker } from "~/types/warning/taskWarnings/lostWaker";

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

    getById(id: bigint): T | undefined {
        return this.items.value.get(id);
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

export class ResourceState {
    resources: Store<TokioResource>;

    constructor() {
        this.resources = new Store();
    }

    /**
     *  Convert the resource update from the server to resources.
     * @param update - The update from the server.
     * @param metas - The metadata for the resources.
     * @returns The resources.
     */
    resourceUpdateToResources(
        update: ResourceUpdate,
        metas: Map<bigint, Metadata>,
    ): TokioResource[] {
        const result = new Array<TokioResource>();
        const { newResources: resources, statsUpdate } = update;

        // Get the parents of the resources.
        const parents: Map<bigint, TokioResource> = resources.reduce(
            (map, resource) => {
                const parentId = resource.parentResourceId?.id;
                if (parentId) {
                    const parent = this.resources.getBySpanId(parentId);
                    if (parent) {
                        map.set(parentId, parent);
                    }
                }
                return map;
            },
            new Map<bigint, TokioResource>(),
        );

        for (const resource of resources) {
            if (!resource.id) {
                consola.warn("skipping resource with no id", resource);
                continue;
            }

            let metaId;
            if (resource.metadata) {
                metaId = resource.metadata.id;
            } else {
                consola.warn("resource has no metadata id, skipping", resource);
                continue;
            }

            const meta = metas.get(metaId);
            if (!meta) {
                consola.warn("no metadata for resource, skipping", resource);
                continue;
            }

            if (!resource.kind) {
                continue;
            }
            let kind;
            try {
                kind = kindFromProto(resource.kind);
            } catch (e) {
                consola.warn(
                    "resource kind cannot ve parsed",
                    resource.kind,
                    e,
                );
                continue;
            }

            const spanId = resource.id.id;
            const stats = statsUpdate[spanId.toString()];
            if (!stats) {
                continue;
            }
            // Delete
            delete statsUpdate[spanId.toString()];
            const resourceStats = fromProtoResourceStats(stats, meta);

            const id = this.resources.idFor(spanId);
            let parentId = resource.parentResourceId?.id;
            let parentIdStr = "N/A";
            let parentStr = "N/A";
            if (parentId) {
                parentId = this.resources.idFor(parentId);
                parentIdStr = parentId.toString();
                const parent = parents.get(parentId);
                if (parent) {
                    parentStr = `${parent.id} (${parent.target}::${parent.concreteType})`;
                }
            }

            const location = formatLocation(resource.location);
            let visibility;
            if (resource.isInternal) {
                visibility = Visibility.Internal;
            } else {
                visibility = Visibility.Public;
            }

            const r = new TokioResource(
                id,
                spanId,
                parentStr,
                parentIdStr,
                metaId,
                kind,
                resourceStats,
                meta.target,
                resource.concreteType,
                location,
                visibility,
            );
            result.push(r);
        }

        return result;
    }

    /**
     * Add resources to the state.
     * @param update - The update from the server.
     * @param metas - The metadata for the resources.
     */
    addResources(update: Update, metas: Map<bigint, Metadata>) {
        if (!update.resourceUpdate) return;
        const resources = this.resourceUpdateToResources(
            update.resourceUpdate,
            metas,
        );
        resources.forEach((resource) =>
            this.resources.items.value.set(resource.id, resource),
        );

        Object.entries(update.resourceUpdate.statsUpdate).forEach(
            ([spanId, statsUpdate]) => {
                const resource = this.resources.getBySpanId(BigInt(spanId));
                if (!resource) return;

                const meta = metas.get(resource.metaId);
                if (!meta) return;

                resource.stats = fromProtoResourceStats(statsUpdate, meta);
                this.resources.items.value.set(resource.id, resource);
            },
        );
    }

    /**
     * Retain the resources for the given duration.
     * This will remove the resources that are older than the given duration.
     * @param retainFor - The duration to retain the resources.
     * @param lastUpdatedAt - The last updated at time.
     */
    retainResources(
        retainFor: Duration,
        lastUpdatedAt: Ref<Timestamp | undefined>,
    ) {
        const newResources = new Map<bigint, TokioResource>();
        for (const [id, resource] of this.resources.items.value) {
            const shouldRetain =
                !resource.stats.droppedAt ||
                lastUpdatedAt.value
                    ?.subtract(resource.stats.droppedAt)
                    .greaterThan(retainFor) === false;
            if (shouldRetain) {
                newResources.set(id, resource);
            }
        }
        this.resources.items.value = newResources;
    }
}

export class AsyncOpState {
    asyncOps: Store<AsyncOp>;

    constructor() {
        this.asyncOps = new Store();
    }

    /**
     * Convert the async op update from the server to async ops.
     * @param asyncOpUpdate - The async op update from the server.
     * @param metas - The metadata for the async ops.
     * @param taskState - The task state.
     * @param resourceState - The resource state.
     * @returns The async ops.
     */
    asyncOpUpdateToOps(
        asyncOpUpdate: AsyncOpUpdate,
        metas: Map<bigint, Metadata>,
        taskState: TaskState,
        resourceState: ResourceState,
    ): AsyncOp[] {
        const result = new Array<AsyncOp>();
        const { newAsyncOps: ops, statsUpdate } = asyncOpUpdate;

        for (const op of ops) {
            if (!op.id) {
                consola.warn("skipping async op with no id", op);
                continue;
            }

            let metaId;
            if (op.metadata) {
                metaId = op.metadata.id;
            } else {
                consola.warn("async op has no metadata id, skipping", op);
                continue;
            }

            const meta = metas.get(metaId);
            if (!meta) {
                consola.warn("no metadata for async op, skipping", op, metaId);
                continue;
            }

            const spanId = op.id.id;
            const stats = statsUpdate[spanId.toString()];
            if (!stats) {
                continue;
            }
            // Delete
            delete statsUpdate[spanId.toString()];
            const asyncOpStats = fromProtoAsyncOpStats(
                stats,
                meta,
                taskState.tasks.ids,
            );

            const id = this.asyncOps.idFor(spanId);
            if (!op.resourceId) {
                continue;
            }
            const resourceId = resourceState.resources.idFor(op.resourceId.id);
            let parentIdStr = "N/A";
            if (op.parentAsyncOpId) {
                parentIdStr = this.asyncOps
                    .idFor(op.parentAsyncOpId.id)
                    .toString();
            }
            const source = op.source;

            const o = new AsyncOp(
                id,
                parentIdStr,
                resourceId,
                metaId,
                source,
                asyncOpStats,
            );
            result.push(o);
        }
        return result;
    }

    /**
     * Add async ops to the state.
     * @param update - The update from the server.
     */
    addAsyncOps(
        update: Update,
        metas: Map<bigint, Metadata>,
        taskState: TaskState,
        resourceState: ResourceState,
    ) {
        if (!update.asyncOpUpdate) return;

        const ops = this.asyncOpUpdateToOps(
            update.asyncOpUpdate,
            metas,
            taskState,
            resourceState,
        );
        ops.forEach((op) => this.asyncOps.items.value.set(op.id, op));

        for (const k in update.asyncOpUpdate.statsUpdate) {
            const op = this.asyncOps.getBySpanId(BigInt(k));
            if (!op) continue;

            const meta = metas.get(op.metaId);
            if (!meta) continue;

            const stats = update.asyncOpUpdate.statsUpdate[k];
            const statsUpdate = fromProtoAsyncOpStats(
                stats,
                meta,
                taskState.tasks.ids,
            );
            op.stats = statsUpdate;
            this.asyncOps.items.value.set(op.id, op);
        }
    }

    /**
     * Retain the async ops for the specified duration.
     * This will remove async ops that are older than the specified duration.
     * @param retainFor - The duration to retain the async ops.
     * @param lastUpdatedAt - The last updated at time.
     */
    retainAsyncOps(
        retainFor: Duration,
        lastUpdatedAt: Ref<Timestamp | undefined>,
    ) {
        const newOps = new Map<bigint, AsyncOp>();
        for (const [id, op] of this.asyncOps.items.value) {
            const shouldRetain =
                !op.stats.droppedAt ||
                lastUpdatedAt.value
                    ?.subtract(op.stats.droppedAt)
                    .greaterThan(retainFor) === false;

            if (shouldRetain) {
                newOps.set(id, op);
            }
        }
        this.asyncOps.items.value = newOps;
    }
}

export interface State {
    // Metadata about a task.
    metas: Map<bigint, Metadata>;
    // How long to retain tasks after they're dropped.
    retainFor: Duration;
    taskState: TaskState;
    resourceState: ResourceState;
    asyncOpsState: AsyncOpState;
    lastUpdatedAt: Ref<Timestamp | undefined>;
    isUpdateWatched: boolean;
}

export const state: State = {
    metas: new Map(),
    // TODO: make this configurable.
    retainFor: new Duration(6n, 0),
    // TODO: make this configurable.
    taskState: new TaskState(new NeverYielded(), new LostWaker()),
    resourceState: new ResourceState(),
    asyncOpsState: new AsyncOpState(),
    lastUpdatedAt: ref<Timestamp | undefined>(undefined),
    isUpdateWatched: false,
};
