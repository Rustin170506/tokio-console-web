/* tslint:disable */
/* eslint-disable */
/**
* Deserializes the histogram from the given bytes.
* @param {Uint8Array} bytes
* @param {number} width
* @returns {MiniHistogram}
*/
export function deserializeHistogram(bytes: Uint8Array, width: number): MiniHistogram;
/**
* Contains the duration and the count of that duration.
*/
export class DurationCount {
  free(): void;
/**
* @param {bigint} duration
* @param {bigint} count
*/
  constructor(duration: bigint, count: bigint);
/**
*/
  count: bigint;
/**
*/
  duration: bigint;
}
/**
* Contains the serialized histogram and the min and max values.
*/
export class MiniHistogram {
  free(): void;
/**
*/
  readonly data: (DurationCount)[];
/**
*/
  max: bigint;
/**
*/
  min: bigint;
/**
*/
  readonly percentiles: (Percentile)[];
}
/**
* Contains the percentile and the value at that percentile.
*/
export class Percentile {
  free(): void;
/**
* @param {number} percentile
* @param {bigint} value
*/
  constructor(percentile: number, value: bigint);
/**
*/
  percentile: number;
/**
*/
  value: bigint;
}
