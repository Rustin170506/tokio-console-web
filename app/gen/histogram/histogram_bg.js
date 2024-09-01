let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let cachedUint32Memory0 = null;

function getUint32Memory0() {
    if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for (let i = 0; i < slice.length; i++) {
        result.push(takeObject(slice[i]));
    }
    return result;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
* Deserializes the histogram from the given bytes.
* @param {Uint8Array} bytes
* @param {number} width
* @returns {MiniHistogram}
*/
export function deserializeHistogram(bytes, width) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.deserializeHistogram(ptr0, len0, width);
    return MiniHistogram.__wrap(ret);
}

const DurationCountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_durationcount_free(ptr >>> 0));
/**
* Contains the duration and the count of that duration.
*/
export class DurationCount {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DurationCount.prototype);
        obj.__wbg_ptr = ptr;
        DurationCountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DurationCountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_durationcount_free(ptr);
    }
    /**
    * @returns {bigint}
    */
    get duration() {
        const ret = wasm.__wbg_get_durationcount_duration(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set duration(arg0) {
        wasm.__wbg_set_durationcount_duration(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint}
    */
    get count() {
        const ret = wasm.__wbg_get_durationcount_count(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set count(arg0) {
        wasm.__wbg_set_durationcount_count(this.__wbg_ptr, arg0);
    }
    /**
    * @param {bigint} duration
    * @param {bigint} count
    */
    constructor(duration, count) {
        const ret = wasm.durationcount_new(duration, count);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}

const MiniHistogramFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_minihistogram_free(ptr >>> 0));
/**
* Contains the serialized histogram and the min and max values.
*/
export class MiniHistogram {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(MiniHistogram.prototype);
        obj.__wbg_ptr = ptr;
        MiniHistogramFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MiniHistogramFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_minihistogram_free(ptr);
    }
    /**
    * @returns {bigint}
    */
    get min() {
        const ret = wasm.__wbg_get_durationcount_duration(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set min(arg0) {
        wasm.__wbg_set_durationcount_duration(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint}
    */
    get max() {
        const ret = wasm.__wbg_get_durationcount_count(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set max(arg0) {
        wasm.__wbg_set_durationcount_count(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {(Percentile)[]}
    */
    get percentiles() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.minihistogram_percentiles(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {(DurationCount)[]}
    */
    get data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.minihistogram_data(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const PercentileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_percentile_free(ptr >>> 0));
/**
* Contains the percentile and the value at that percentile.
*/
export class Percentile {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Percentile.prototype);
        obj.__wbg_ptr = ptr;
        PercentileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PercentileFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_percentile_free(ptr);
    }
    /**
    * @returns {number}
    */
    get percentile() {
        const ret = wasm.__wbg_get_percentile_percentile(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set percentile(arg0) {
        wasm.__wbg_set_percentile_percentile(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint}
    */
    get value() {
        const ret = wasm.__wbg_get_durationcount_count(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set value(arg0) {
        wasm.__wbg_set_durationcount_count(this.__wbg_ptr, arg0);
    }
    /**
    * @param {number} percentile
    * @param {bigint} value
    */
    constructor(percentile, value) {
        const ret = wasm.percentile_new(percentile, value);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}

export function __wbg_durationcount_new(arg0) {
    const ret = DurationCount.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_percentile_new(arg0) {
    const ret = Percentile.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

