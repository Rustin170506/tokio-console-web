extern crate wasm_bindgen;

use std::io::Cursor;

use hdrhistogram::Histogram;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Percentile {
    pub percentile: f64,
    pub value: u64,
}

impl Percentile {
    pub fn new(percentile: f64, value: u64) -> Percentile {
        Percentile { percentile, value }
    }
}

#[wasm_bindgen(js_name = deserializeHistogram)]
pub fn deserialize_histogram(bytes: &[u8]) -> Vec<Percentile> {
    let histogram: Histogram<u64> = hdrhistogram::serialization::Deserializer::new()
        .deserialize(&mut Cursor::new(&bytes))
        .expect("Failed to deserialize histogram");
    // Get the important percentile values from the histogram
    let pairs = [10f64, 25f64, 50f64, 75f64, 90f64, 95f64, 99f64]
        .iter()
        .map(move |i| (*i, histogram.value_at_percentile(*i)));
    pairs.map(|(p, v)| Percentile::new(p, v)).collect()
}
