use crate::{comments::JSDocTagLookup, positions::SourcePositions};
use indexmap::{IndexMap, IndexSet};
use napi_derive::napi;
use oxc_ast::AstKind;
use oxc_span::Span;
use std::{
    cell::{Ref, RefCell},
    collections::HashMap,
    rc::Rc,
};

pub const RE_EXPORT: u32 = 1;
pub const TYPE_ONLY: u32 = 2;
pub const ENTRY: u32 = 4;
pub const BRIDGE: u32 = 8;
pub const OPTIONAL: u32 = 16;
pub const SIDE_EFFECTS: u32 = 32;
pub const OPAQUE: u32 = 64;
pub const AUGMENT: u32 = 128;
pub const DYNAMIC: u32 = 256;
pub const LOADER: u32 = 512;
pub type Strings = IndexSet<String>;
pub type Fix = Option<[u32; 3]>;
pub type IdMap = IndexMap<String, Strings>;
pub type NsMap = IndexMap<String, IdMap>;

#[derive(Clone, Default)]
pub struct Tags(Option<Rc<RefCell<Strings>>>);

impl FromIterator<String> for Tags {
    fn from_iter<T: IntoIterator<Item = String>>(iter: T) -> Self {
        let values: Strings = iter.into_iter().collect();
        if values.is_empty() {
            Self::default()
        } else {
            Self(Some(Rc::new(RefCell::new(values))))
        }
    }
}

impl Tags {
    pub fn identity(&self) -> usize {
        self.0.as_ref().map_or(0, |tags| Rc::as_ptr(tags) as usize)
    }
    pub fn values(&self) -> Option<Ref<'_, Strings>> {
        self.0.as_ref().map(|tags| tags.borrow())
    }
    pub fn is_empty(&self) -> bool {
        self.0.is_none()
    }
    pub fn contains(&self, tag: &str) -> bool {
        self.0
            .as_ref()
            .is_some_and(|tags| tags.borrow().contains(tag))
    }
    pub fn merge(&mut self, tags: Self) {
        if self.identity() == tags.identity() {
            return;
        }
        if let Some(incoming) = tags.values() {
            if let Some(current) = &self.0 {
                current.borrow_mut().extend(incoming.iter().cloned());
            } else {
                *self = Self(Some(Rc::new(RefCell::new(incoming.clone()))));
            }
        }
    }
    pub fn union(&self, tags: Self) -> Self {
        if tags.is_empty() {
            return self.clone();
        }
        let mut values = self.values().map_or_else(Strings::new, |tags| tags.clone());
        if let Some(tags) = tags.values() {
            values.extend(tags.iter().cloned());
        }
        Self(Some(Rc::new(RefCell::new(values))))
    }
}

#[napi(object)]
#[derive(Default)]
pub struct AnalyzerOptions {
    pub skip_type_only: bool,
    pub is_fix_exports: bool,
    pub is_fix_types: bool,
    pub is_report_exports: bool,
    pub tags: Vec<Vec<String>>,
    pub skip_exports_for_file: bool,
    pub include_local_refs: bool,
    pub count_ref_types: Vec<String>,
    pub plugins: Vec<String>,
    pub path_strings_lossy: Option<bool>,
    pub raw_comments: Option<bool>,
    pub wasi_parser: Option<bool>,
    pub cwd: Option<napi::bindgen_prelude::Utf16String>,
}

#[derive(Clone, Default)]
pub struct Resolution {
    pub kind: String,
    pub resolved_file_name: Option<String>,
    pub is_external_library_import: Option<bool>,
    pub external_specifier: Option<String>,
}

#[derive(Clone, Default)]
pub struct Import {
    pub specifier: String,
    pub file_path: Option<String>,
    pub identifier: Option<String>,
    pub alias: Option<String>,
    pub pos: u32,
    pub line: u32,
    pub col: u32,
    pub is_type_only: bool,
    pub modifiers: u32,
    pub js_doc_tags: Option<Tags>,
}

#[derive(Default)]
pub struct ImportMaps {
    pub refs: Strings,
    pub enumerated: Option<Strings>,
    pub import: IdMap,
    pub import_as: NsMap,
    pub import_ns: IdMap,
    pub re_export: IdMap,
    pub re_export_ns: IdMap,
    pub re_export_as: NsMap,
}

#[derive(Clone, Default)]
pub struct ExportMember {
    pub identifier: String,
    pub r#type: String,
    pub pos: u32,
    pub line: u32,
    pub col: u32,
    pub fix: Fix,
    pub js_doc_tags: Tags,
    pub flags: u32,
    pub has_refs_in_file: bool,
}

#[derive(Default)]
pub struct Export {
    pub identifier: String,
    pub binding: String,
    pub r#type: String,
    pub members: Vec<ExportMember>,
    pub pos: u32,
    pub line: u32,
    pub col: u32,
    pub js_doc_tags: Tags,
    pub has_refs_in_file: bool,
    pub is_registered: bool,
    pub referenced_in: Option<Strings>,
    pub fixes: Vec<[u32; 3]>,
    pub is_re_export: bool,
    pub is_binding_re_export: bool,
}

#[derive(Clone)]
pub struct IssueSymbol {
    pub symbol: String,
    pub pos: u32,
    pub line: u32,
    pub col: u32,
}
#[derive(Default)]
pub struct ImportGlob {
    pub patterns: Vec<String>,
    pub base: Option<String>,
    pub cwd: Option<String>,
    pub filter: Option<(String, String)>,
    pub analyze_exports: Option<bool>,
}
#[derive(Clone)]
pub struct LocalImport {
    pub imported_name: String,
    pub file_path: String,
    pub is_namespace: bool,
    pub is_dynamic_import: bool,
}
#[derive(Clone)]
pub struct ImportAlias {
    pub id: String,
    pub file_path: String,
}

pub struct State<'a, 'h> {
    pub source_text: &'a str,
    pub raw_source: Option<&'a [u16]>,
    pub file_path: &'a str,
    pub positions: SourcePositions,
    pub tags: JSDocTagLookup,
    tag_sets: RefCell<HashMap<u32, Tags>>,
    pub options: AnalyzerOptions,
    pub resolver: &'h mut dyn FnMut(&str, bool) -> crate::error::Result<Resolution>,
    pub reg_exp_validator: &'h mut dyn FnMut(&str, &str) -> crate::error::Result<()>,
    pub error: Option<crate::error::AnalysisError>,
    pub skip_exports: bool,
    pub is_dts: bool,
    pub is_js: bool,
    pub is_module_file: bool,
    pub internal: IndexMap<String, ImportMaps>,
    pub external: Vec<Import>,
    pub unresolved: Vec<Import>,
    pub imports: Vec<Import>,
    pub program_files: Strings,
    pub entry_files: Strings,
    pub exports: IndexMap<String, Export>,
    pub aliased_exports: IndexMap<String, Vec<IssueSymbol>>,
    pub specifier_export_names: Strings,
    pub scripts: Strings,
    pub import_globs: Vec<ImportGlob>,
    pub handled_import_expressions: IndexSet<u32>,
    pub local_import_map: IndexMap<String, LocalImport>,
    pub builtin_imports: IndexMap<String, Import>,
    pub local_declaration_types: IndexMap<String, String>,
    pub referenced_in_export: IndexMap<String, Strings>,
    pub destructured_exports: Strings,
    pub registered_custom_elements: Strings,
    pub import_aliases: IndexMap<String, Vec<ImportAlias>>,
    pub bare_expr_refs: Strings,
    pub accessed_aliases: Strings,
    pub ns_containers: IndexMap<String, IndexMap<String, String>>,
    pub accessed_ns_containers: Strings,
    pub dotted_namespace_children: IndexSet<(u32, u32)>,
    pub type_member_exprs: IndexSet<(u32, u32)>,
    pub chained_member_exprs: IndexSet<(u32, u32)>,
    pub current_var_decl_start: Option<u32>,
    pub ns_ranges: Vec<Span>,
    pub member_refs_in_file: Vec<(String, String)>,
    pub imported_refs: Strings,
    pub local_refs: Option<Strings>,
    pub scopes: Vec<Span>,
    pub shadow_scopes: IndexMap<String, Vec<Span>>,
    pub local_declarations: IndexMap<String, AstKind<'a>>,
    pub local_interfaces: IndexMap<String, Option<&'a oxc_ast::ast::TSInterfaceDeclaration<'a>>>,
    pub local_to_exports: IndexMap<String, Strings>,
    pub custom_element_registries: Strings,
    pub class_name_stack: Vec<String>,
    pub static_block_depth: u32,
    pub has_node_module_import: bool,
    pub has_worker_threads_import: bool,
    pub has_child_process_import: bool,
    pub has_path_join_import: bool,
    pub has_path_resolve_import: bool,
    pub child_process_namespaces: Strings,
    pub child_process_methods: IndexMap<String, String>,
    pub refs: super::exports::RefState<'a>,
}

pub fn add_value(map: &mut IdMap, id: &str, file_path: &str) {
    map.entry(id.to_owned())
        .or_default()
        .insert(file_path.to_owned());
}
pub fn add_ns_value(map: &mut NsMap, id: &str, alias: &str, file_path: &str) {
    add_value(map.entry(id.to_owned()).or_default(), alias, file_path);
}
pub fn add_ns_member_ref(map: &mut ImportMaps, namespace: &str, member: &str) {
    map.refs.insert(format!("{namespace}.{member}"));
}
pub fn in_node_modules(path: &str) -> bool {
    path.contains("node_modules")
}

impl<'a, 'h> State<'a, 'h> {
    pub fn pos(&self, byte: u32) -> u32 {
        self.positions.utf16_offset(byte)
    }
    pub fn get_tags(&self, byte: u32) -> Tags {
        let values = self.tags.get(self.pos(byte));
        if values.is_empty() {
            return Tags::default();
        }
        self.tag_sets
            .borrow_mut()
            .entry(byte)
            .or_insert_with(|| values.iter().cloned().collect())
            .clone()
    }
    pub fn is_in_namespace(&self, span: Span) -> bool {
        self.ns_ranges
            .iter()
            .any(|range| span.start >= range.start && span.end <= range.end)
    }
    pub fn is_shadowed(&self, name: &str, byte: u32) -> bool {
        if self
            .local_import_map
            .get(name)
            .is_some_and(|i| i.is_dynamic_import)
        {
            return false;
        }
        self.shadow_scopes
            .get(name)
            .is_some_and(|ranges| ranges.iter().any(|r| byte >= r.start && byte <= r.end))
    }
    pub fn resolve_module(&mut self, specifier: &str) -> Resolution {
        if self.error.is_some() {
            return Resolution::default();
        }
        match (self.resolver)(specifier, true) {
            Ok(r) => r,
            Err(e) => {
                self.error = Some(e);
                Resolution::default()
            }
        }
    }
    pub fn validate_reg_exp(&mut self, pattern: &str, flags: &str) -> bool {
        if self.error.is_some() {
            return false;
        }
        match (self.reg_exp_validator)(pattern, flags) {
            Ok(()) => true,
            Err(error) => {
                self.error = Some(error);
                false
            }
        }
    }
    pub fn get_fix(&self, start: u32, end: u32, flags: u32) -> Fix {
        self.options
            .is_fix_exports
            .then(|| [self.pos(start), self.pos(end), flags])
    }
    pub fn get_type_fix(&self, start: u32, end: u32) -> Fix {
        self.options
            .is_fix_types
            .then(|| [self.pos(start), self.pos(end), 0])
    }
    pub fn add_ref_in_export(&mut self, name: &str, export_name: &str) {
        self.referenced_in_export
            .entry(name.to_owned())
            .or_default()
            .insert(export_name.to_owned());
    }
    pub fn add_import_alias(&mut self, alias: &str, id: &str, file_path: &str) {
        self.import_aliases
            .entry(alias.to_owned())
            .or_default()
            .push(ImportAlias {
                id: id.to_owned(),
                file_path: file_path.to_owned(),
            });
    }
    pub fn add_local_ref(&mut self, name: &str, byte: u32) {
        if self.local_refs.is_none() || self.is_shadowed(name, byte) {
            return;
        }
        if self.local_import_map.contains_key(name) {
            self.imported_refs.insert(name.to_owned());
        } else if let Some(refs) = &mut self.local_refs {
            refs.insert(name.to_owned());
        }
    }
    pub fn add_export(
        &mut self,
        identifier: &str,
        symbol_type: &str,
        byte_pos: u32,
        members: Vec<ExportMember>,
        fix: Fix,
        is_re_export: bool,
        tags: Tags,
        binding: Option<&str>,
        is_binding_re_export: bool,
    ) {
        if let Some(item) = self.exports.get_mut(identifier) {
            item.members.extend(members);
            if let Some(fix) = fix {
                item.fixes.push(fix);
            }
            item.js_doc_tags.merge(tags);
            item.is_re_export = is_re_export;
            item.is_binding_re_export = is_binding_re_export;
        } else {
            let p = self.positions.position(byte_pos);
            self.exports.insert(
                identifier.to_owned(),
                Export {
                    identifier: identifier.to_owned(),
                    binding: binding.unwrap_or(identifier).to_owned(),
                    r#type: symbol_type.to_owned(),
                    members,
                    pos: p.pos,
                    line: p.line,
                    col: p.col,
                    js_doc_tags: tags,
                    fixes: fix.into_iter().collect(),
                    is_re_export,
                    is_binding_re_export,
                    ..Export::default()
                },
            );
        }
    }
}

impl State<'_, '_> {
    pub fn add_import(
        &mut self,
        specifier: &str,
        identifier: Option<&str>,
        alias: Option<&str>,
        namespace: Option<&str>,
        byte_pos: u32,
        modifiers: u32,
        specifier_byte_pos: Option<u32>,
        tags: Option<Tags>,
        pre_resolved: Option<Resolution>,
    ) -> Option<Import> {
        self.add_import_at(
            specifier,
            identifier,
            alias,
            namespace,
            self.pos(byte_pos),
            modifiers,
            specifier_byte_pos.map(|p| self.pos(p)),
            tags,
            pre_resolved,
        )
    }
    pub fn add_import_at(
        &mut self,
        specifier: &str,
        identifier: Option<&str>,
        alias: Option<&str>,
        namespace: Option<&str>,
        pos: u32,
        modifiers: u32,
        specifier_pos: Option<u32>,
        tags: Option<Tags>,
        pre_resolved: Option<Resolution>,
    ) -> Option<Import> {
        if specifier.is_empty() {
            return None;
        }
        let module = pre_resolved.unwrap_or_else(|| {
            if self.error.is_some() {
                return Resolution::default();
            }
            match (self.resolver)(specifier, false) {
                Ok(r) => r,
                Err(e) => {
                    self.error = Some(e);
                    Resolution::default()
                }
            }
        });
        let is_type_only = self.is_dts || modifiers & TYPE_ONLY != 0;
        if module.kind == "builtin" {
            let (line, col) = crate::positions::get_line_and_col(self.positions.line_starts(), pos);
            let import = Import {
                specifier: if specifier.starts_with("node:") {
                    specifier.to_owned()
                } else {
                    format!("node:{specifier}")
                },
                file_path: None,
                identifier: Some(identifier.unwrap_or("__side-effects").to_owned()),
                alias: namespace.or(alias).map(str::to_owned),
                pos,
                line,
                col,
                is_type_only,
                modifiers,
                js_doc_tags: tags,
            };
            if modifiers & RE_EXPORT != 0 {
                self.imports.push(import.clone());
            }
            return Some(import);
        }
        let external = module.is_external_library_import.unwrap_or(false);
        let resolved = module.kind == "resolved";
        if modifiers & AUGMENT != 0
            && (!resolved
                || external
                || module
                    .resolved_file_name
                    .as_deref()
                    .is_some_and(in_node_modules))
        {
            return None;
        }
        if resolved {
            if let Some(path) = module.resolved_file_name.filter(|p| !p.is_empty()) {
                if !in_node_modules(&path) {
                    if modifiers & ENTRY != 0 {
                        self.entry_files.insert(path.clone());
                    }
                    if modifiers & BRIDGE != 0 {
                        self.program_files.insert(path.clone());
                    }
                }
                if !external || !in_node_modules(&path) {
                    let (line, col) =
                        crate::positions::get_line_and_col(self.positions.line_starts(), pos);
                    self.imports.push(Import {
                        specifier: specifier.to_owned(),
                        file_path: Some(path.clone()),
                        identifier: namespace.or(identifier).map(str::to_owned),
                        alias: alias.map(str::to_owned),
                        pos,
                        line,
                        col,
                        is_type_only,
                        modifiers,
                        js_doc_tags: None,
                    });
                    let id = identifier.unwrap_or(if modifiers & OPAQUE != 0 {
                        "__opaque"
                    } else if modifiers & LOADER != 0 {
                        "__loader-default"
                    } else {
                        "__side-effects"
                    });
                    let maps = self.internal.entry(path.clone()).or_default();
                    if modifiers & RE_EXPORT != 0 {
                        if id == "*" && namespace.is_some_and(|ns| !ns.is_empty()) {
                            add_value(&mut maps.re_export_ns, namespace.unwrap(), self.file_path);
                        } else if let Some(alias) = alias.filter(|s| !s.is_empty()) {
                            add_ns_value(&mut maps.re_export_as, id, alias, self.file_path);
                        } else {
                            add_value(&mut maps.re_export, id, self.file_path);
                        }
                    } else if let Some(alias) = alias.filter(|a| !a.is_empty() && *a != id) {
                        if id == "*" {
                            add_value(&mut maps.import_ns, alias, self.file_path);
                        } else {
                            add_ns_value(&mut maps.import_as, id, alias, self.file_path);
                        }
                    } else if id != "*" {
                        add_value(&mut maps.import, id, self.file_path);
                    }
                }
                if external && !(self.options.skip_type_only && modifiers & TYPE_ONLY != 0) {
                    if let Some(specifier) = module.external_specifier {
                        let pos = specifier_pos.unwrap_or(pos);
                        let (line, col) =
                            crate::positions::get_line_and_col(self.positions.line_starts(), pos);
                        self.external.push(Import {
                            specifier,
                            file_path: Some(path),
                            identifier: Some(identifier.unwrap_or("__side-effects").to_owned()),
                            alias: alias.map(str::to_owned),
                            pos,
                            line,
                            col,
                            is_type_only,
                            modifiers,
                            js_doc_tags: tags,
                        });
                    }
                }
            }
        } else if !(self.options.skip_type_only && modifiers & TYPE_ONLY != 0)
            && !specifier.starts_with("virtual:")
        {
            if modifiers & OPTIONAL != 0 {
                self.program_files.insert(super::common::resolve_path(
                    self.file_path,
                    specifier,
                    &self.options,
                ));
            } else {
                let ignore = tags.as_ref().is_some_and(|t| {
                    !t.is_empty()
                        && (self.options.tags.first().is_some_and(|include| {
                            !include.is_empty() && !include.iter().any(|tag| t.contains(tag))
                        }) || self
                            .options
                            .tags
                            .get(1)
                            .is_some_and(|exclude| exclude.iter().any(|tag| t.contains(tag))))
                });
                if !ignore {
                    let pos = specifier_pos.unwrap_or(pos);
                    let (line, col) =
                        crate::positions::get_line_and_col(self.positions.line_starts(), pos);
                    self.unresolved.push(Import {
                        specifier: specifier.to_owned(),
                        file_path: None,
                        identifier: Some(identifier.unwrap_or("__side-effects").to_owned()),
                        alias: alias.map(str::to_owned),
                        pos,
                        line,
                        col,
                        is_type_only,
                        modifiers,
                        js_doc_tags: None,
                    });
                }
            }
        }
        None
    }
}

impl<'a, 'h> State<'a, 'h> {
    pub fn new(
        source_text: &'a str,
        raw_source: Option<&'a [u16]>,
        file_path: &'a str,
        tags: JSDocTagLookup,
        positions: SourcePositions,
        options: AnalyzerOptions,
        is_module_file: bool,
        resolver: &'h mut dyn FnMut(&str, bool) -> crate::error::Result<Resolution>,
        reg_exp_validator: &'h mut dyn FnMut(&str, &str) -> crate::error::Result<()>,
    ) -> Self {
        Self {
            source_text: source_text,
            raw_source,
            file_path: file_path,
            positions,
            tags: tags,
            tag_sets: Default::default(),
            resolver: resolver,
            reg_exp_validator,
            error: Default::default(),
            skip_exports: options.skip_exports_for_file || !options.is_report_exports,
            is_dts: file_path.ends_with(".d.ts")
                || file_path.ends_with(".d.cts")
                || file_path.ends_with(".d.mts"),
            is_js: [".js", ".mjs", ".cjs", ".jsx"]
                .iter()
                .any(|ext| file_path.ends_with(ext)),
            is_module_file: is_module_file,
            internal: Default::default(),
            external: Default::default(),
            unresolved: Default::default(),
            imports: Default::default(),
            program_files: Default::default(),
            entry_files: Default::default(),
            exports: Default::default(),
            aliased_exports: Default::default(),
            specifier_export_names: Default::default(),
            scripts: Default::default(),
            import_globs: Default::default(),
            handled_import_expressions: Default::default(),
            local_import_map: Default::default(),
            builtin_imports: Default::default(),
            local_declaration_types: Default::default(),
            referenced_in_export: Default::default(),
            destructured_exports: Default::default(),
            registered_custom_elements: Default::default(),
            import_aliases: Default::default(),
            bare_expr_refs: Default::default(),
            accessed_aliases: Default::default(),
            ns_containers: Default::default(),
            accessed_ns_containers: Default::default(),
            dotted_namespace_children: Default::default(),
            type_member_exprs: Default::default(),
            chained_member_exprs: Default::default(),
            current_var_decl_start: Default::default(),
            ns_ranges: Default::default(),
            member_refs_in_file: Default::default(),
            imported_refs: Default::default(),
            local_refs: options.include_local_refs.then(Strings::new),
            scopes: Default::default(),
            shadow_scopes: Default::default(),
            local_declarations: Default::default(),
            local_interfaces: Default::default(),
            local_to_exports: Default::default(),
            custom_element_registries: Default::default(),
            class_name_stack: Default::default(),
            static_block_depth: Default::default(),
            has_node_module_import: Default::default(),
            has_worker_threads_import: Default::default(),
            has_child_process_import: Default::default(),
            has_path_join_import: Default::default(),
            has_path_resolve_import: Default::default(),
            child_process_namespaces: Default::default(),
            child_process_methods: Default::default(),
            refs: Default::default(),
            options,
        }
    }
}
