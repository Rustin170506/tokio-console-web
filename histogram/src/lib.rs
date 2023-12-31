extern crate wasm_bindgen;

use std::io::Cursor;

use hdrhistogram::Histogram;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct MiniHistogram {
    percentiles: Vec<Percentile>,
    data: Vec<DurationCount>,
    pub min: u64,
    pub max: u64,
}

#[wasm_bindgen]
impl MiniHistogram {
    #[wasm_bindgen(getter)]
    pub fn percentiles(&self) -> Vec<Percentile> {
        self.percentiles.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Vec<DurationCount> {
        self.data.clone()
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct DurationCount {
    pub duration: u64,
    pub count: u64,
}

#[wasm_bindgen]
impl DurationCount {
    #[wasm_bindgen(constructor)]
    pub fn new(duration: u64, count: u64) -> DurationCount {
        DurationCount { duration, count }
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Percentile {
    pub percentile: f64,
    pub value: u64,
}

#[wasm_bindgen]
impl Percentile {
    #[wasm_bindgen(constructor)]
    pub fn new(percentile: f64, value: u64) -> Percentile {
        Percentile { percentile, value }
    }
}

#[wasm_bindgen(js_name = deserializeHistogram)]
pub fn deserialize_histogram(bytes: &[u8]) -> MiniHistogram {
    let histogram: Histogram<u64> = hdrhistogram::serialization::Deserializer::new()
        .deserialize(&mut Cursor::new(&bytes))
        .expect("Failed to deserialize histogram");
    let min = histogram.min();
    let max = histogram.max();
    let step_size = ((max - min) as f64 / 40 as f64).ceil() as u64 + 1;
    let mut found_first_nonzero = false;
    let data: Vec<DurationCount> = histogram
        .iter_linear(step_size)
        .filter_map(|value| {
            let count = value.count_since_last_iteration();
            // Remove the 0s from the leading side of the buckets.
            // Because HdrHistogram can return empty buckets depending
            // on its internal state, as it approximates values.
            if count == 0 && !found_first_nonzero {
                None
            } else {
                found_first_nonzero = true;
                Some((value.value_iterated_to(), count))
            }
        })
        .map(|(duration, count)| DurationCount::new(duration, count))
        .collect();
    // Get the important percentile values from the histogram
    let pairs = [10f64, 25f64, 50f64, 75f64, 90f64, 95f64, 99f64]
        .iter()
        .map(move |i| (*i, histogram.value_at_percentile(*i)));
    let percentiles = pairs.map(|(p, v)| Percentile::new(p, v)).collect();

    MiniHistogram {
        data,
        percentiles,
        max,
        min,
    }
}
