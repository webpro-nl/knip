use super::{common::encode_literal, state::*};
use oxc_syntax::module_record::{
    ExportExportName, ExportImportName, ImportImportName, ModuleRecord,
};

pub fn collect(module: &ModuleRecord<'_>, s: &mut State<'_, '_>) {
    let mut requests = Vec::new();
    for (specifier, occurrences) in &module.requested_modules {
        for request in occurrences {
            if request.is_import {
                requests.push((request, specifier));
            }
        }
    }
    requests.sort_by_key(|(request, _)| request.statement_span.start);
    for (request, raw_specifier) in requests {
        let specifier = encode_literal(raw_specifier, false);
        let path_import = specifier == "path" || specifier == "node:path";
        let child_process = specifier == "child_process" || specifier == "node:child_process";
        if specifier == "module" || specifier == "node:module" {
            s.has_node_module_import = true;
        } else if specifier == "worker_threads" || specifier == "node:worker_threads" {
            s.has_worker_threads_import = true;
        } else if child_process {
            s.has_child_process_import = true;
        }
        let tags = s.get_tags(request.statement_span.start);
        let start = module
            .import_entries
            .partition_point(|e| e.statement_span.start < request.statement_span.start);
        let end = module
            .import_entries
            .partition_point(|e| e.statement_span.start <= request.statement_span.start);
        let entries = &module.import_entries[start..end];
        if entries.is_empty() {
            s.add_import(
                &specifier,
                None,
                None,
                None,
                request.span.start,
                SIDE_EFFECTS,
                None,
                Some(tags),
                None,
            );
            continue;
        }
        let resolved = s.resolve_module(&specifier);
        let internal_path = resolved.resolved_file_name.clone().filter(|p| {
            !p.is_empty()
                && !resolved.is_external_library_import.unwrap_or(false)
                && !in_node_modules(p)
        });
        for entry in entries {
            let local_name = encode_literal(&entry.local_name.name, false);
            let modifiers = if entry.is_type { TYPE_ONLY } else { 0 };
            let (imported_name, namespace) = match &entry.import_name {
                ImportImportName::NamespaceObject => {
                    if child_process {
                        s.child_process_namespaces.insert(local_name.clone());
                    }
                    ("*".to_owned(), true)
                }
                ImportImportName::Default(_) => {
                    if child_process {
                        s.child_process_namespaces.insert(local_name.clone());
                    }
                    ("default".to_owned(), false)
                }
                ImportImportName::Name(name) => {
                    let imported = encode_literal(&name.name, false);
                    if child_process {
                        s.child_process_methods
                            .insert(local_name.clone(), imported.clone());
                    }
                    if path_import && imported == local_name {
                        if imported == "join" {
                            s.has_path_join_import = true;
                        } else if imported == "resolve" {
                            s.has_path_resolve_import = true;
                        }
                    }
                    (imported, false)
                }
            };
            let alias = (namespace || local_name != imported_name).then_some(local_name.as_str());
            let pre_resolved = (resolved.kind != "unresolved").then(|| resolved.clone());
            let builtin = s.add_import(
                &specifier,
                Some(&imported_name),
                alias,
                None,
                entry.local_name.span.start,
                modifiers,
                Some(request.span.start),
                Some(tags.clone()),
                pre_resolved,
            );
            if let Some(file_path) = &internal_path {
                s.local_import_map.insert(
                    local_name.clone(),
                    LocalImport {
                        imported_name,
                        file_path: file_path.clone(),
                        is_namespace: namespace,
                        is_dynamic_import: false,
                    },
                );
            }
            if let Some(builtin) = builtin {
                s.builtin_imports.insert(local_name, builtin);
            }
        }
    }
    let mut entries: Vec<_> = module
        .local_export_entries
        .iter()
        .chain(module.indirect_export_entries.iter())
        .chain(module.star_export_entries.iter())
        .collect();
    entries.sort_by_key(|e| e.statement_span.start);
    let mut previous_statement = None;
    let mut previous_specifier = String::new();
    let mut resolved = Resolution::default();
    for entry in entries {
        let Some(request) = &entry.module_request else {
            continue;
        };
        let specifier = encode_literal(&request.name, false);
        if previous_statement != Some(entry.statement_span.start) || previous_specifier != specifier
        {
            resolved = s.resolve_module(&specifier);
            previous_specifier = specifier.clone();
            previous_statement = Some(entry.statement_span.start);
        }
        let modifiers = RE_EXPORT | if entry.is_type { TYPE_ONLY } else { 0 };
        let tags = s.get_tags(entry.statement_span.start);
        let pre_resolved = (resolved.kind != "unresolved").then(|| resolved.clone());
        let export_name = match &entry.export_name {
            ExportExportName::Name(name) => Some(encode_literal(&name.name, false)),
            ExportExportName::Default(_) => Some("default".to_owned()),
            ExportExportName::Null => None,
        };
        match &entry.import_name {
            ExportImportName::AllButDefault => {
                s.add_import(
                    &specifier,
                    Some("*"),
                    None,
                    None,
                    request.span.start,
                    modifiers,
                    None,
                    Some(tags),
                    pre_resolved,
                );
            }
            ExportImportName::All => {
                s.add_import(
                    &specifier,
                    Some("*"),
                    None,
                    export_name.as_deref(),
                    entry.span.start,
                    modifiers,
                    Some(request.span.start),
                    Some(tags),
                    pre_resolved,
                );
            }
            ExportImportName::Name(name) => {
                let imported_name = encode_literal(&name.name, false);
                let source_name = s
                    .builtin_imports
                    .get(&imported_name)
                    .filter(|b| b.pos == s.pos(name.span.start))
                    .and_then(|b| b.identifier.clone())
                    .unwrap_or(imported_name);
                let alias = export_name
                    .as_deref()
                    .filter(|name| !name.is_empty() && *name != source_name);
                s.add_import(
                    &specifier,
                    Some(&source_name),
                    alias,
                    None,
                    entry.span.start,
                    modifiers,
                    Some(request.span.start),
                    None,
                    pre_resolved,
                );
            }
            ExportImportName::Null => {}
        }
    }
}
