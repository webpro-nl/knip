use std::collections::HashMap;

use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;

#[napi(object)]
pub struct ContainmentExport {
    pub identifier: Utf16String,
    pub referenced_in: Vec<Utf16String>,
    pub eligible: bool,
    pub seed: bool,
}

#[napi]
pub fn live_containing_exports(exports: Vec<ContainmentExport>) -> Vec<bool> {
    let mut identifiers = HashMap::with_capacity(exports.len());
    for (index, export) in exports.iter().enumerate() {
        identifiers.insert(export.identifier.to_vec(), index);
    }

    let mut dependents = vec![Vec::new(); exports.len()];
    let mut live = vec![false; exports.len()];
    let mut pending = Vec::new();
    for (index, export) in exports.iter().enumerate() {
        for name in &export.referenced_in {
            let Some(&container) = identifiers.get(&name[..]) else {
                continue;
            };
            if !exports[container].eligible {
                continue;
            }
            dependents[container].push(index);
            if exports[container].seed && !live[index] {
                live[index] = true;
                pending.push(index);
            }
        }
    }

    while let Some(container) = pending.pop() {
        for &index in &dependents[container] {
            if !live[index] {
                live[index] = true;
                pending.push(index);
            }
        }
    }
    live
}
