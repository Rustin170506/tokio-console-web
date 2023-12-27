extern crate wasm_bindgen;

use std::io::Cursor;

use hdrhistogram::Histogram;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = deserializeHistogram)]
pub fn deserialize_histogram(bytes: &[u8]) -> u64 {
    let l: Histogram<u64> = hdrhistogram::serialization::Deserializer::new()
        .deserialize(&mut Cursor::new(&bytes))
        .expect("Failed to deserialize histogram");

    l.value_at_percentile(10f64)
}
