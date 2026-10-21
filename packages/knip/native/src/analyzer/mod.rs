pub(crate) mod common;
mod compact;
mod exports;
mod imports;
mod members;
mod plugins;
mod state;
mod static_imports;
mod walk;

use crate::{
    comments::{JSDocTagLookup, extract_imports_from_comments},
    parse::{parse_source, parser_text},
    positions::SourcePositions,
};
use common::{encode_utf16, utf16};
pub(crate) use compact::{CompactFile, RawCompactFile};
use napi::bindgen_prelude::{FnArgs, Function, Utf16String};
use napi_derive::napi;
use oxc_allocator::Allocator;
use oxc_ast::ast::{Statement, TSModuleReference};
use oxc_ast_visit::Visit;
use state::*;
pub(crate) use state::{AnalyzerOptions, Resolution};

#[napi(object)]
pub struct HostResolution {
    pub kind: String,
    pub resolved_file_name: Option<Utf16String>,
    pub is_external_library_import: Option<bool>,
    pub external_specifier: Option<Utf16String>,
}

#[napi]
pub fn analyze_file(
    file_path: Utf16String,
    source_text: Utf16String,
    options: AnalyzerOptions,
    resolver: Function<FnArgs<(Utf16String, bool)>, HostResolution>,
    validate_reg_exp: Function<FnArgs<(Utf16String, Utf16String)>, ()>,
) -> napi::Result<compact::CompactFile> {
    let mut resolve = |specifier: &str, resolve_builtin: bool| {
        resolver
            .call((utf16(specifier), resolve_builtin).into())
            .map(|r| Resolution {
                kind: r.kind,
                resolved_file_name: r.resolved_file_name.map(|s| encode_utf16(&s)),
                is_external_library_import: r.is_external_library_import,
                external_specifier: r.external_specifier.map(|s| encode_utf16(&s)),
            })
    };
    let mut validate =
        |pattern: &str, flags: &str| validate_reg_exp.call((utf16(pattern), utf16(flags)).into());
    analyze_with_resolver(
        encode_utf16(&file_path),
        source_text,
        options,
        &mut resolve,
        &mut validate,
    )
}

pub(crate) fn analyze_with_resolver(
    file_path: String,
    source_utf16: Utf16String,
    options: AnalyzerOptions,
    resolve: &mut dyn FnMut(&str, bool) -> napi::Result<Resolution>,
    validate: &mut dyn FnMut(&str, &str) -> napi::Result<()>,
) -> napi::Result<CompactFile> {
    let mut resolve_error = None;
    let mut validate_error = None;
    let mut resolve_host = |specifier: &str, builtin: bool| {
        resolve(specifier, builtin).map_err(|error| {
            resolve_error = Some(error);
            crate::error::AnalysisError::HostCallback
        })
    };
    let mut validate_host = |pattern: &str, flags: &str| {
        validate(pattern, flags).map_err(|error| {
            validate_error = Some(error);
            crate::error::AnalysisError::HostCallback
        })
    };
    let source_text = parser_text(&source_utf16, options.wasi_parser.unwrap_or(false));
    analyze_source(
        &file_path,
        &source_text,
        Some(&source_utf16),
        options,
        &mut resolve_host,
        &mut validate_host,
    )
    .map(Into::into)
    .map_err(|error| {
        resolve_error
            .or(validate_error)
            .unwrap_or_else(|| error.into_napi())
    })
}

pub(crate) fn analyze_source(
    file_path: &str,
    source_text: &str,
    original: Option<&[u16]>,
    options: AnalyzerOptions,
    resolve: &mut dyn FnMut(&str, bool) -> crate::error::Result<Resolution>,
    validate: &mut dyn FnMut(&str, &str) -> crate::error::Result<()>,
) -> crate::error::Result<RawCompactFile> {
    let wasi_parser = options.wasi_parser.unwrap_or(false);
    let allocator = Allocator::default();
    let parsed = parse_source(&allocator, &utf16(file_path), source_text, wasi_parser);
    let decoded;
    let source_utf16: &[u16] = if let Some(original) = original {
        original
    } else if options.raw_comments.unwrap_or(false) || !parsed.program.comments.is_empty() {
        decoded = source_text.encode_utf16().collect::<Vec<_>>();
        &decoded
    } else {
        &[]
    };
    let raw_source = options
        .raw_comments
        .unwrap_or(false)
        .then_some(source_utf16);
    let positions = SourcePositions::with_original(source_text, original.filter(|_| wasi_parser));
    let tags = JSDocTagLookup::new(
        &parsed.program.comments,
        source_text,
        source_utf16,
        &positions,
    );
    let is_module_file = parsed.module_record.has_module_syntax || parsed.program.body.iter().any(|node| matches!(node, Statement::TSImportEqualsDeclaration(n) if matches!(n.module_reference, TSModuleReference::ExternalModuleReference(_))));
    let mut state = State::new(
        source_text,
        raw_source,
        file_path,
        tags,
        positions,
        options,
        is_module_file,
        resolve,
        validate,
    );
    static_imports::collect(&parsed.module_record, &mut state);
    let plugins = plugins::Plugins::new(&state.options.plugins)?;
    walk::Walker {
        state: &mut state,
        plugins,
    }
    .visit_program(&parsed.program);
    walk::finish(&mut state);
    for request in extract_imports_from_comments(&parsed.program, &state.positions, raw_source) {
        state.add_import_at(
            &encode_utf16(&request.specifier),
            request.identifier.as_deref(),
            request.alias.as_deref(),
            request.namespace.as_deref(),
            request.pos,
            request.modifiers,
            request.specifier_pos,
            request.js_doc_tags.map(|tags| tags.into_iter().collect()),
            None,
        );
    }
    let mut builtin_reexports = Vec::new();
    for (name, export) in &mut state.exports {
        if state.specifier_export_names.contains(name) {
            if let Some(import) = state.builtin_imports.get(&export.binding) {
                export.is_re_export = true;
                export.is_binding_re_export = true;
                if import.identifier.as_deref() == Some("*") {
                    builtin_reexports.push((
                        import.specifier.clone(),
                        name.clone(),
                        export.pos,
                        import.is_type_only || export.r#type == "type",
                    ));
                }
            }
        }
        export.referenced_in = state.referenced_in_export.shift_remove(name);
        if let Some(refs) = &state.local_refs {
            if refs.contains(name)
                && (state
                    .options
                    .count_ref_types
                    .iter()
                    .any(|t| t == "*" || t == &export.r#type))
            {
                export.has_refs_in_file = true;
            }
        }
    }
    for (specifier, name, pos, is_type) in builtin_reexports {
        state.add_import_at(
            &specifier,
            Some("*"),
            Some(&name),
            None,
            pos,
            RE_EXPORT | if is_type { TYPE_ONLY } else { 0 },
            None,
            None,
            None,
        );
    }
    if let Some(error) = state.error.take() {
        return Err(error);
    }
    Ok(compact::file(state))
}
