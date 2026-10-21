use std::collections::HashSet;

use indexmap::{IndexMap, IndexSet};
use napi::bindgen_prelude::{Uint32Array, Utf16String};
use napi::{Error, Result};
use napi_derive::napi;

type Symbol = usize;
type Sources = IndexMap<Symbol, IndexSet<Symbol>>;
type Aliases = IndexMap<Symbol, Sources>;
type GraphResult<T> = std::result::Result<T, &'static str>;

#[napi(object)]
pub struct GraphReferenceResult {
    pub referenced: bool,
    pub entry_path: Option<Utf16String>,
    pub re_exported_ids: Option<Vec<Utf16String>>,
}

#[napi(object)]
pub struct GraphNamespaceResult {
    pub referenced: bool,
    pub namespace: Option<Utf16String>,
}

#[derive(Default)]
struct Strings(IndexSet<Vec<u16>>);

impl Strings {
    fn intern(&mut self, value: &[u16]) -> Symbol {
        if let Some(symbol) = self.lookup(value) {
            return symbol;
        }
        self.0.insert_full(value.to_vec()).0
    }

    fn lookup(&self, value: &[u16]) -> Option<Symbol> {
        self.0.get_index_of(value)
    }

    fn get(&self, symbol: Symbol) -> &[u16] {
        &self.0[symbol]
    }

    fn truthy(&self, symbol: Option<Symbol>) -> bool {
        symbol.is_some_and(|symbol| !self.get(symbol).is_empty())
    }
}

enum ReaderStrings<'a> {
    Snapshot(usize),
    Compact {
        values: &'a [Utf16String],
        symbols: Vec<Option<Symbol>>,
        strings: &'a mut Strings,
    },
}

struct SnapshotReader<'a> {
    data: &'a [u32],
    strings: ReaderStrings<'a>,
}

impl SnapshotReader<'_> {
    fn word(&mut self) -> GraphResult<u32> {
        let Some((&value, rest)) = self.data.split_first() else {
            return Err("Truncated usage graph snapshot");
        };
        self.data = rest;
        Ok(value)
    }

    fn count(&mut self) -> GraphResult<usize> {
        let count = self.word()? as usize;
        if count > self.data.len() {
            return Err("Invalid usage graph collection length");
        }
        Ok(count)
    }

    fn symbol(&mut self) -> GraphResult<Symbol> {
        let symbol = self.word()? as usize;
        match &mut self.strings {
            ReaderStrings::Snapshot(count) if symbol < *count => Ok(symbol),
            ReaderStrings::Compact {
                values,
                symbols,
                strings,
            } if symbol < values.len() => {
                Ok(*symbols[symbol].get_or_insert_with(|| strings.intern(&values[symbol])))
            }
            _ => Err("Invalid usage graph string index"),
        }
    }

    fn boolean(&mut self) -> GraphResult<bool> {
        match self.word()? {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err("Invalid compact graph boolean"),
        }
    }

    fn symbols(&mut self, count: usize) -> GraphResult<Vec<Symbol>> {
        if count > self.data.len() {
            return Err("Invalid usage graph collection length");
        }
        let mut result = Vec::with_capacity(count);
        for _ in 0..count {
            result.push(self.symbol()?);
        }
        Ok(result)
    }

    fn set(&mut self) -> GraphResult<HashSet<Symbol>> {
        let count = self.count()?;
        let mut result = HashSet::with_capacity(count);
        for _ in 0..count {
            result.insert(self.symbol()?);
        }
        Ok(result)
    }

    fn sources(&mut self) -> GraphResult<Sources> {
        let count = self.count()?;
        let mut result = Sources::with_capacity(count);
        for _ in 0..count {
            let id = self.symbol()?;
            let count = self.count()?;
            let mut sources = IndexSet::with_capacity(count);
            for _ in 0..count {
                sources.insert(self.symbol()?);
            }
            result.insert(id, sources);
        }
        Ok(result)
    }

    fn aliases(&mut self) -> GraphResult<Aliases> {
        let count = self.count()?;
        let mut result = Aliases::with_capacity(count);
        for _ in 0..count {
            let id = self.symbol()?;
            result.insert(id, self.sources()?);
        }
        Ok(result)
    }
}

#[derive(Default)]
struct Imports {
    refs: HashSet<Symbol>,
    enumerated: Option<HashSet<Symbol>>,
    imports: Sources,
    import_as: Aliases,
    import_ns: Sources,
    re_export: Sources,
    re_export_as: Aliases,
    re_export_ns: Sources,
    member_namespaces: HashSet<Symbol>,
    only_ns_refs: bool,
}

impl Imports {
    fn read(reader: &mut SnapshotReader, strings: &Strings) -> GraphResult<Self> {
        let refs = reader.set()?;
        let enumerated_count = reader.word()?;
        let enumerated = if enumerated_count == 0 {
            None
        } else {
            Some(
                reader
                    .symbols((enumerated_count - 1) as usize)?
                    .into_iter()
                    .collect(),
            )
        };
        let imports = reader.sources()?;
        let import_as = reader.aliases()?;
        let import_ns = reader.sources()?;
        let re_export = reader.sources()?;
        let re_export_as = reader.aliases()?;
        let re_export_ns = reader.sources()?;
        let mut imports = Self {
            refs,
            enumerated,
            imports,
            import_as,
            import_ns,
            re_export,
            re_export_as,
            re_export_ns,
            ..Self::default()
        };
        imports.finalize(strings);
        Ok(imports)
    }

    fn read_compact(reader: &mut SnapshotReader) -> GraphResult<Self> {
        Ok(Self {
            refs: reader.set()?,
            enumerated: if reader.boolean()? {
                Some(reader.set()?)
            } else {
                None
            },
            imports: reader.sources()?,
            import_as: reader.aliases()?,
            import_ns: reader.sources()?,
            re_export: reader.sources()?,
            re_export_ns: reader.sources()?,
            re_export_as: reader.aliases()?,
            ..Self::default()
        })
    }

    fn merge(&mut self, other: Self) {
        self.refs.extend(other.refs);
        if let Some(enumerated) = other.enumerated {
            self.enumerated
                .get_or_insert_with(HashSet::new)
                .extend(enumerated);
        }
        Self::merge_sources(&mut self.imports, other.imports);
        Self::merge_aliases(&mut self.import_as, other.import_as);
        Self::merge_sources(&mut self.import_ns, other.import_ns);
        Self::merge_sources(&mut self.re_export, other.re_export);
        Self::merge_aliases(&mut self.re_export_as, other.re_export_as);
        Self::merge_sources(&mut self.re_export_ns, other.re_export_ns);
    }

    fn merge_sources(target: &mut Sources, source: Sources) {
        for (id, sources) in source {
            match target.entry(id) {
                indexmap::map::Entry::Occupied(mut entry) => entry.get_mut().extend(sources),
                indexmap::map::Entry::Vacant(entry) => {
                    entry.insert(sources);
                }
            }
        }
    }

    fn merge_aliases(target: &mut Aliases, source: Aliases) {
        for (id, aliases) in source {
            match target.entry(id) {
                indexmap::map::Entry::Occupied(mut entry) => {
                    Self::merge_sources(entry.get_mut(), aliases)
                }
                indexmap::map::Entry::Vacant(entry) => {
                    entry.insert(aliases);
                }
            }
        }
    }

    fn finalize(&mut self, strings: &Strings) {
        self.member_namespaces.clear();
        for &reference in &self.refs {
            let value = strings.get(reference);
            for (index, &unit) in value.iter().enumerate() {
                if unit == 46 {
                    if let Some(namespace) = strings.lookup(&value[..index]) {
                        if self.import_ns.contains_key(&namespace) {
                            self.member_namespaces.insert(namespace);
                        }
                    }
                }
            }
        }
        self.only_ns_refs = !self.import_ns.is_empty()
            && self
                .import_ns
                .keys()
                .all(|ns| self.refs.contains(ns) && !self.member_namespaces.contains(ns));
    }
}

#[derive(Default)]
struct Node {
    skip_exports: bool,
    has_default_export: bool,
    imported_by: Option<Imports>,
}

struct ReferenceState {
    seen: HashSet<Vec<u16>>,
    referenced: bool,
    entry_path: Option<Symbol>,
    re_exported_ids: Option<IndexSet<Vec<u16>>>,
    traverse_entries: bool,
    treat_star_at_entry_as_referenced: bool,
}

impl ReferenceState {
    fn complete(&self) -> bool {
        self.referenced && (self.traverse_entries || self.entry_path.is_some())
    }
}

#[derive(Default)]
struct NamespaceResult {
    referenced: bool,
    namespace: Option<Symbol>,
}

#[napi]
pub struct NativeUsageGraph {
    strings: Strings,
    nodes: IndexMap<Symbol, Node>,
    entries: HashSet<Symbol>,
    star: Symbol,
    opaque: Symbol,
    loader_default: Symbol,
    default_export: Symbol,
}

#[napi]
impl NativeUsageGraph {
    #[napi(constructor)]
    pub fn new(values: Vec<Utf16String>, data: Uint32Array) -> Result<Self> {
        Self::from_snapshot(values, &data).map_err(Error::from_reason)
    }

    #[napi]
    pub fn is_referenced(
        &self,
        file_path: Utf16String,
        identifier: Utf16String,
        traverse_entries: bool,
        treat_star_at_entry_as_referenced: bool,
    ) -> GraphReferenceResult {
        let mut state = ReferenceState {
            seen: HashSet::new(),
            referenced: false,
            entry_path: None,
            re_exported_ids: None,
            traverse_entries,
            treat_star_at_entry_as_referenced,
        };
        if let Some(path) = self.strings.lookup(&file_path) {
            self.walk_reference(path, &identifier, false, &mut state);
        }
        GraphReferenceResult {
            referenced: state.referenced,
            entry_path: state
                .entry_path
                .map(|path| self.strings.get(path).to_vec().into()),
            re_exported_ids: state.re_exported_ids.map(|ids| {
                let mut result = Vec::with_capacity(ids.len());
                for id in ids {
                    result.push(id.into());
                }
                result
            }),
        }
    }

    #[napi]
    pub fn has_strictly_ns_references(
        &self,
        file_path: Utf16String,
        identifier: Utf16String,
    ) -> GraphNamespaceResult {
        let result = self
            .strings
            .lookup(&file_path)
            .map(|path| self.walk_namespace(path, &identifier, &mut HashSet::new()))
            .unwrap_or_default();
        GraphNamespaceResult {
            referenced: result.referenced,
            namespace: result
                .namespace
                .map(|namespace| self.strings.get(namespace).to_vec().into()),
        }
    }

    #[napi]
    pub fn is_enumerated(&self, file_path: Utf16String, identifier: Utf16String) -> bool {
        self.strings
            .lookup(&file_path)
            .is_some_and(|path| self.walk_enumerated(path, &identifier, &mut HashSet::new()))
    }
}

impl NativeUsageGraph {
    fn from_snapshot(values: Vec<Utf16String>, data: &[u32]) -> GraphResult<Self> {
        let string_count = values.len();
        let mut strings = Strings(IndexSet::with_capacity(string_count + 4));
        for value in values {
            if !strings.0.insert(value.to_vec()) {
                return Err("Duplicate usage graph string");
            }
        }
        let mut reader = SnapshotReader {
            data,
            strings: ReaderStrings::Snapshot(string_count),
        };
        let entries = reader.set()?;
        let count = reader.count()?;
        let mut nodes = IndexMap::with_capacity(count);
        for _ in 0..count {
            let path = reader.symbol()?;
            let flags = reader.word()?;
            if flags > 7 {
                return Err("Invalid usage graph node flags");
            }
            let imported_by = if flags & 4 == 0 {
                None
            } else {
                Some(Imports::read(&mut reader, &strings)?)
            };
            nodes.insert(
                path,
                Node {
                    skip_exports: flags & 1 != 0,
                    has_default_export: flags & 2 != 0,
                    imported_by,
                },
            );
        }
        if !reader.data.is_empty() {
            return Err("Unexpected usage graph snapshot data");
        }
        Ok(Self::from_parts(strings, nodes, entries))
    }

    fn from_parts(
        mut strings: Strings,
        nodes: IndexMap<Symbol, Node>,
        entries: HashSet<Symbol>,
    ) -> Self {
        let star = strings.intern(&[42]);
        let opaque = strings.intern(&"__opaque".encode_utf16().collect::<Vec<_>>());
        let loader_default = strings.intern(&"__loader-default".encode_utf16().collect::<Vec<_>>());
        let default_export = strings.intern(&"default".encode_utf16().collect::<Vec<_>>());
        Self {
            strings,
            nodes,
            entries,
            star,
            opaque,
            loader_default,
            default_export,
        }
    }

    fn imported_by(&self, path: Symbol) -> Option<&Imports> {
        self.nodes.get(&path)?.imported_by.as_ref()
    }

    fn has_ref(&self, imports: &Imports, id: &[u16]) -> bool {
        self.strings
            .lookup(id)
            .is_some_and(|symbol| imports.refs.contains(&symbol))
    }

    fn prefixed(&self, prefix: Symbol, id: &[u16]) -> Vec<u16> {
        [self.strings.get(prefix), &[46], id].concat()
    }

    fn aliased(&self, alias: Symbol, rest: &[u16]) -> Vec<u16> {
        [self.strings.get(alias), rest].concat()
    }

    fn follow_reference(
        &self,
        sources: &IndexSet<Symbol>,
        id: &[u16],
        via_star: bool,
        state: &mut ReferenceState,
    ) -> bool {
        for &source in sources {
            if self.walk_reference(source, id, via_star, state) {
                return true;
            }
        }
        false
    }

    fn walk_reference(
        &self,
        path: Symbol,
        id: &[u16],
        via_star: bool,
        state: &mut ReferenceState,
    ) -> bool {
        let is_entry = self.entries.contains(&path);
        if is_entry && !self.strings.truthy(state.entry_path) {
            state.entry_path = Some(path);
        }
        if state.entry_path == Some(path) {
            state
                .re_exported_ids
                .get_or_insert_with(IndexSet::new)
                .insert(id.to_vec());
        }
        if state.complete() {
            return true;
        }

        let end = id.iter().position(|&unit| unit == 46).unwrap_or(id.len());
        let identifier = &id[..end];
        let rest = &id[end..];
        let key = [self.strings.get(path), &[58], identifier].concat();
        if !state.seen.insert(key) {
            return false;
        }
        if state.treat_star_at_entry_as_referenced && is_entry && via_star && !rest.is_empty() {
            state.referenced = true;
            return state.complete();
        }
        if identifier.is_empty() {
            return false;
        }
        let Some(node) = self.nodes.get(&path) else {
            return false;
        };
        if is_entry && node.skip_exports {
            state.referenced = true;
            return state.complete();
        }
        let Some(file) = &node.imported_by else {
            return false;
        };
        let symbol = self.strings.lookup(identifier);

        if !state.referenced {
            let loader = file.imports.contains_key(&self.loader_default);
            let direct = ((file.imports.contains_key(&self.opaque)
                || (loader && !node.has_default_export))
                && !file.only_ns_refs)
                || (loader && symbol == Some(self.default_export))
                || ((rest.is_empty() || self.has_ref(file, id))
                    && symbol.is_some_and(|symbol| {
                        file.imports.contains_key(&symbol) || file.import_as.contains_key(&symbol)
                    }));
            if direct {
                state.referenced = true;
                if state.complete() {
                    return true;
                }
            }
        }

        if !state.referenced {
            if let Some(aliases) = symbol.and_then(|symbol| file.import_as.get(&symbol)) {
                for &alias in aliases.keys() {
                    if self.has_ref(file, &self.aliased(alias, rest)) {
                        state.referenced = true;
                        break;
                    }
                }
            }
            if state.complete() {
                return true;
            }
        }

        for &namespace in file.import_ns.keys() {
            if !state.referenced && self.has_ref(file, &self.prefixed(namespace, id)) {
                state.referenced = true;
                if state.complete() {
                    return true;
                }
            }
            if let Some(aliases) = file.re_export_as.get(&namespace) {
                for (&alias, sources) in aliases {
                    if self.follow_reference(sources, &self.prefixed(alias, id), via_star, state) {
                        return true;
                    }
                }
            }
            if let Some(sources) = file.re_export_ns.get(&namespace) {
                if self.follow_reference(sources, &self.prefixed(namespace, id), via_star, state) {
                    return true;
                }
            }
        }

        if is_entry && !state.traverse_entries {
            return false;
        }
        if let Some(aliases) = symbol.and_then(|symbol| file.re_export_as.get(&symbol)) {
            for (&alias, sources) in aliases {
                if self.follow_reference(sources, &self.aliased(alias, rest), via_star, state) {
                    return true;
                }
            }
        }
        if let Some(sources) = symbol.and_then(|symbol| file.re_export.get(&symbol)) {
            if self.follow_reference(sources, id, via_star, state) {
                return true;
            }
        } else if let Some(sources) = file.re_export.get(&self.star) {
            if self.follow_reference(sources, id, true, state) {
                return true;
            }
        }
        for (&namespace, sources) in &file.re_export_ns {
            if self.follow_reference(sources, &self.prefixed(namespace, id), true, state) {
                return true;
            }
        }
        false
    }

    fn follow_namespace(
        &self,
        sources: &IndexSet<Symbol>,
        id: &[u16],
        namespace: &mut Option<Symbol>,
        seen: &mut HashSet<Symbol>,
    ) -> Option<NamespaceResult> {
        for &source in sources {
            let result = self.walk_namespace(source, id, seen);
            if self.strings.truthy(result.namespace) {
                if !result.referenced {
                    return Some(result);
                }
                if !self.strings.truthy(*namespace) {
                    *namespace = result.namespace;
                }
            }
        }
        None
    }

    fn walk_namespace(
        &self,
        path: Symbol,
        id: &[u16],
        seen: &mut HashSet<Symbol>,
    ) -> NamespaceResult {
        let Some(file) = self.imported_by(path) else {
            return NamespaceResult::default();
        };
        if !seen.insert(path) {
            return NamespaceResult::default();
        }
        let mut namespace = None;
        for &ns in file.import_ns.keys() {
            if !file.refs.contains(&ns) || file.member_namespaces.contains(&ns) {
                return NamespaceResult {
                    referenced: false,
                    namespace: Some(ns),
                };
            }
            namespace = Some(ns);
            if let Some(aliases) = file.re_export_as.get(&ns) {
                for (&alias, sources) in aliases {
                    if let Some(result) = self.follow_namespace(
                        sources,
                        self.strings.get(alias),
                        &mut namespace,
                        seen,
                    ) {
                        return result;
                    }
                }
            }
        }
        let symbol = self.strings.lookup(id);
        if let Some(sources) = symbol.and_then(|symbol| file.re_export.get(&symbol)) {
            if let Some(result) = self.follow_namespace(sources, id, &mut namespace, seen) {
                return result;
            }
        }
        if let Some(sources) = file.re_export.get(&self.star) {
            if let Some(result) = self.follow_namespace(sources, id, &mut namespace, seen) {
                return result;
            }
        }
        let end = id.iter().position(|&unit| unit == 46).unwrap_or(id.len());
        if let Some(aliases) = self
            .strings
            .lookup(&id[..end])
            .and_then(|symbol| file.re_export_as.get(&symbol))
        {
            for (&alias, sources) in aliases {
                if let Some(result) = self.follow_namespace(
                    sources,
                    &self.aliased(alias, &id[end..]),
                    &mut namespace,
                    seen,
                ) {
                    return result;
                }
            }
        }
        for (&ns, sources) in &file.re_export_ns {
            if let Some(result) =
                self.follow_namespace(sources, &self.prefixed(ns, id), &mut namespace, seen)
            {
                return result;
            }
        }
        if let Some(sources) = symbol.and_then(|symbol| file.imports.get(&symbol)) {
            if let Some(result) = self.follow_namespace(sources, id, &mut namespace, seen) {
                return result;
            }
        }
        if let Some(aliases) = symbol.and_then(|symbol| file.import_as.get(&symbol)) {
            for (&alias, sources) in aliases {
                if let Some(result) =
                    self.follow_namespace(sources, self.strings.get(alias), &mut namespace, seen)
                {
                    return result;
                }
            }
        }
        if self.strings.truthy(namespace) {
            NamespaceResult {
                referenced: true,
                namespace,
            }
        } else {
            NamespaceResult::default()
        }
    }

    fn follow_enumerated(
        &self,
        sources: &IndexSet<Symbol>,
        id: &[u16],
        seen: &mut HashSet<Symbol>,
    ) -> bool {
        for &source in sources {
            if self.walk_enumerated(source, id, seen) {
                return true;
            }
        }
        false
    }

    fn walk_enumerated(&self, path: Symbol, id: &[u16], seen: &mut HashSet<Symbol>) -> bool {
        let Some(file) = self.imported_by(path) else {
            return false;
        };
        if !seen.insert(path) {
            return false;
        }
        let symbol = self.strings.lookup(id);
        if symbol.is_some_and(|symbol| {
            file.enumerated
                .as_ref()
                .is_some_and(|enumerated| enumerated.contains(&symbol))
        }) {
            return true;
        }
        if let Some(sources) = symbol.and_then(|symbol| file.re_export.get(&symbol)) {
            if self.follow_enumerated(sources, id, seen) {
                return true;
            }
        }
        if let Some(sources) = file.re_export.get(&self.star) {
            if self.follow_enumerated(sources, id, seen) {
                return true;
            }
        }
        if let Some(aliases) = symbol.and_then(|symbol| file.re_export_as.get(&symbol)) {
            for (&alias, sources) in aliases {
                if self.follow_enumerated(sources, self.strings.get(alias), seen) {
                    return true;
                }
            }
        }
        false
    }
}

#[napi]
pub struct NativeProjectGraph {
    usage: NativeUsageGraph,
    added_files: HashSet<Symbol>,
    finalized: bool,
}

#[napi]
impl NativeProjectGraph {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            usage: NativeUsageGraph::from_parts(
                Strings::default(),
                IndexMap::new(),
                HashSet::new(),
            ),
            added_files: HashSet::new(),
            finalized: false,
        }
    }

    #[napi]
    pub fn add_file(
        &mut self,
        file_path: Utf16String,
        values: Vec<Utf16String>,
        data: Uint32Array,
        has_default_export: bool,
    ) -> Result<Vec<Utf16String>> {
        self.add_record(&file_path, &values, &data, has_default_export)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn finalize(&mut self, entry_paths: Vec<Utf16String>) -> Result<()> {
        self.finish(entry_paths).map_err(Error::from_reason)
    }

    #[napi]
    pub fn is_referenced(
        &self,
        file_path: Utf16String,
        identifier: Utf16String,
        traverse_entries: bool,
        treat_star_at_entry_as_referenced: bool,
    ) -> Result<GraphReferenceResult> {
        self.ensure_finalized().map_err(Error::from_reason)?;
        Ok(self.usage.is_referenced(
            file_path,
            identifier,
            traverse_entries,
            treat_star_at_entry_as_referenced,
        ))
    }

    #[napi]
    pub fn has_strictly_ns_references(
        &self,
        file_path: Utf16String,
        identifier: Utf16String,
    ) -> Result<GraphNamespaceResult> {
        self.ensure_finalized().map_err(Error::from_reason)?;
        Ok(self.usage.has_strictly_ns_references(file_path, identifier))
    }

    #[napi]
    pub fn is_enumerated(&self, file_path: Utf16String, identifier: Utf16String) -> Result<bool> {
        self.ensure_finalized().map_err(Error::from_reason)?;
        Ok(self.usage.is_enumerated(file_path, identifier))
    }

    #[napi]
    pub fn has_importers(&self, file_path: Utf16String) -> Result<bool> {
        self.ensure_finalized().map_err(Error::from_reason)?;
        Ok(self.imported_by(&file_path).is_some())
    }

    #[napi]
    pub fn has_reference(&self, file_path: Utf16String, identifier: Utf16String) -> Result<bool> {
        self.ensure_finalized().map_err(Error::from_reason)?;
        Ok(self.has_reference_record(&file_path, &identifier))
    }

    #[napi]
    pub fn has_strictly_enum_references(
        &self,
        file_path: Utf16String,
        identifier: Utf16String,
    ) -> Result<bool> {
        self.ensure_finalized().map_err(Error::from_reason)?;
        Ok(self.has_strictly_enum_reference_record(&file_path, &identifier))
    }
}

impl NativeProjectGraph {
    fn add_record(
        &mut self,
        file_path: &[u16],
        values: &[Utf16String],
        data: &[u32],
        has_default_export: bool,
    ) -> GraphResult<Vec<Utf16String>> {
        self.ensure_building()?;
        if self
            .usage
            .strings
            .lookup(file_path)
            .is_some_and(|path| self.added_files.contains(&path))
        {
            return Err("File already added to project graph");
        }
        let mut reader = SnapshotReader {
            data,
            strings: ReaderStrings::Compact {
                values,
                symbols: vec![None; values.len()],
                strings: &mut self.usage.strings,
            },
        };
        let skip_exports = reader.boolean()?;
        let count = reader.count()?;
        let mut imports = IndexMap::with_capacity(count);
        for _ in 0..count {
            let path = reader.symbol()?;
            if imports
                .insert(path, Imports::read_compact(&mut reader)?)
                .is_some()
            {
                return Err("Duplicate compact graph import path");
            }
        }
        let path = self.usage.strings.intern(file_path);
        let mut paths = Vec::with_capacity(imports.len());
        for (imported_path, imports) in imports {
            paths.push(self.usage.strings.get(imported_path).to_vec().into());
            let imported_by = &mut self
                .usage
                .nodes
                .entry(imported_path)
                .or_default()
                .imported_by;
            if let Some(existing) = imported_by {
                existing.merge(imports);
            } else {
                *imported_by = Some(imports);
            }
        }
        let node = self.usage.nodes.entry(path).or_default();
        node.skip_exports = skip_exports;
        node.has_default_export = has_default_export;
        self.added_files.insert(path);
        Ok(paths)
    }

    fn finish(&mut self, entry_paths: Vec<Utf16String>) -> GraphResult<()> {
        self.ensure_building()?;
        for path in entry_paths {
            self.usage.entries.insert(self.usage.strings.intern(&path));
        }
        for node in self.usage.nodes.values_mut() {
            if let Some(imports) = &mut node.imported_by {
                imports.finalize(&self.usage.strings);
            }
        }
        self.finalized = true;
        Ok(())
    }

    fn ensure_building(&self) -> GraphResult<()> {
        if self.finalized {
            Err("Project graph already finalized")
        } else {
            Ok(())
        }
    }

    fn ensure_finalized(&self) -> GraphResult<()> {
        if self.finalized {
            Ok(())
        } else {
            Err("Project graph must be finalized before querying")
        }
    }

    fn imported_by(&self, file_path: &[u16]) -> Option<&Imports> {
        self.usage
            .imported_by(self.usage.strings.lookup(file_path)?)
    }

    fn has_reference_record(&self, file_path: &[u16], identifier: &[u16]) -> bool {
        self.imported_by(file_path)
            .is_some_and(|imports| self.usage.has_ref(imports, identifier))
    }

    fn has_strictly_enum_reference_record(&self, file_path: &[u16], identifier: &[u16]) -> bool {
        self.imported_by(file_path).is_some_and(|imports| {
            self.usage.has_ref(imports, identifier)
                && !imports.refs.iter().any(|&id| {
                    let value = self.usage.strings.get(id);
                    value.starts_with(identifier) && value.get(identifier.len()) == Some(&46)
                })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    type TestSources = Vec<(&'static str, Vec<&'static str>)>;
    type TestAliases = Vec<(&'static str, TestSources)>;

    #[derive(Default)]
    struct TestImports {
        refs: Vec<&'static str>,
        enumerated: Option<Vec<&'static str>>,
        imports: TestSources,
        import_as: TestAliases,
        import_ns: TestSources,
        re_export: TestSources,
        re_export_as: TestAliases,
        re_export_ns: TestSources,
    }

    #[derive(Default)]
    struct Encoder {
        strings: IndexSet<Vec<u16>>,
        data: Vec<u32>,
        symbol_positions: Vec<usize>,
        count_positions: Vec<usize>,
        boolean_positions: Vec<usize>,
    }

    fn utf16(value: &str) -> Utf16String {
        value.encode_utf16().collect::<Vec<_>>().into()
    }

    impl Encoder {
        fn symbol(&mut self, value: &str) {
            self.symbol_positions.push(self.data.len());
            self.data
                .push(self.strings.insert_full(value.encode_utf16().collect()).0 as u32);
        }

        fn count(&mut self, count: usize) {
            self.count_positions.push(self.data.len());
            self.data.push(count as u32);
        }

        fn boolean(&mut self, value: bool) {
            self.boolean_positions.push(self.data.len());
            self.data.push(u32::from(value));
        }

        fn set(&mut self, values: &[&str]) {
            self.count(values.len());
            for value in values {
                self.symbol(value);
            }
        }

        fn sources(&mut self, values: &TestSources) {
            self.count(values.len());
            for (id, sources) in values {
                self.symbol(id);
                self.set(sources);
            }
        }

        fn aliases(&mut self, values: &TestAliases) {
            self.count(values.len());
            for (id, sources) in values {
                self.symbol(id);
                self.sources(sources);
            }
        }

        fn imports(&mut self, imports: &TestImports, compact: bool) {
            self.set(&imports.refs);
            if compact {
                self.boolean(imports.enumerated.is_some());
                if let Some(values) = &imports.enumerated {
                    self.set(values);
                }
            } else {
                self.data.push(
                    imports
                        .enumerated
                        .as_ref()
                        .map_or(0, |v| v.len() as u32 + 1),
                );
                if let Some(values) = &imports.enumerated {
                    for value in values {
                        self.symbol(value);
                    }
                }
            }
            self.sources(&imports.imports);
            self.aliases(&imports.import_as);
            self.sources(&imports.import_ns);
            self.sources(&imports.re_export);
            if compact {
                self.sources(&imports.re_export_ns);
                self.aliases(&imports.re_export_as);
            } else {
                self.aliases(&imports.re_export_as);
                self.sources(&imports.re_export_ns);
            }
        }

        fn file(skip_exports: bool, imports: &[(&str, &TestImports)]) -> Self {
            let mut encoder = Self::default();
            encoder.boolean(skip_exports);
            encoder.count(imports.len());
            for (path, imports) in imports {
                encoder.symbol(path);
                encoder.imports(imports, true);
            }
            encoder
        }

        fn values(&self) -> Vec<Utf16String> {
            self.strings.iter().cloned().map(Into::into).collect()
        }
    }

    fn add_file(
        graph: &mut NativeProjectGraph,
        path: &str,
        default: bool,
        file: &Encoder,
    ) -> Vec<Utf16String> {
        graph
            .add_record(&utf16(path), &file.values(), &file.data, default)
            .unwrap()
    }

    fn snapshot(
        entries: &[&str],
        nodes: &[(&str, bool, bool, Option<&TestImports>)],
    ) -> NativeUsageGraph {
        let mut encoder = Encoder::default();
        encoder.set(entries);
        encoder.count(nodes.len());
        for &(path, skip, default, imports) in nodes {
            encoder.symbol(path);
            encoder.data.push(
                u32::from(skip) | u32::from(default) << 1 | u32::from(imports.is_some()) << 2,
            );
            if let Some(imports) = imports {
                encoder.imports(imports, false);
            }
        }
        NativeUsageGraph::from_snapshot(encoder.values(), &encoder.data).unwrap()
    }

    fn reference_result(
        result: GraphReferenceResult,
    ) -> (bool, Option<Vec<u16>>, Option<Vec<Vec<u16>>>) {
        (
            result.referenced,
            result.entry_path.map(|v| v.to_vec()),
            result
                .re_exported_ids
                .map(|v| v.iter().map(|v| v.to_vec()).collect()),
        )
    }

    fn namespace_result(result: GraphNamespaceResult) -> (bool, Option<Vec<u16>>) {
        (result.referenced, result.namespace.map(|v| v.to_vec()))
    }

    fn assert_queries(
        project: &NativeProjectGraph,
        snapshot: &NativeUsageGraph,
        paths: &[&str],
        ids: &[&str],
    ) {
        for path in paths {
            for id in ids {
                for traverse in [false, true] {
                    for star in [false, true] {
                        assert_eq!(
                            reference_result(project.usage.is_referenced(
                                utf16(path),
                                utf16(id),
                                traverse,
                                star
                            )),
                            reference_result(snapshot.is_referenced(
                                utf16(path),
                                utf16(id),
                                traverse,
                                star
                            )),
                            "reference: {path} {id} {traverse} {star}"
                        );
                    }
                }
                assert_eq!(
                    namespace_result(
                        project
                            .usage
                            .has_strictly_ns_references(utf16(path), utf16(id))
                    ),
                    namespace_result(snapshot.has_strictly_ns_references(utf16(path), utf16(id))),
                    "namespace: {path} {id}"
                );
                assert_eq!(
                    project.usage.is_enumerated(utf16(path), utf16(id)),
                    snapshot.is_enumerated(utf16(path), utf16(id)),
                    "enumerated: {path} {id}"
                );
            }
        }
    }

    #[test]
    fn compact_prefix_rejects_malformed_records_without_committing_nodes() {
        let imports = TestImports {
            refs: vec!["Fruit", "Fruit.apple"],
            enumerated: Some(vec!["Color"]),
            imports: vec![("Fruit", vec!["entry.ts"])],
            import_as: vec![("Fruit", vec![("Basket", vec!["entry.ts"])])],
            import_ns: vec![("NS", vec!["entry.ts"])],
            re_export: vec![("*", vec!["entry.ts"])],
            re_export_ns: vec![("Tree", vec!["entry.ts"])],
            re_export_as: vec![("Color", vec![("Shade", vec!["entry.ts"])])],
        };
        let file = Encoder::file(true, &[("leaf.ts", &imports)]);
        let mut graph = NativeProjectGraph::new();
        for end in 0..file.data.len() {
            assert!(
                graph
                    .add_record(&utf16("entry.ts"), &file.values(), &file.data[..end], false)
                    .is_err(),
                "truncation at {end}"
            );
        }
        for &position in file.symbol_positions.iter().chain(&file.count_positions) {
            let mut invalid = file.data.clone();
            invalid[position] = u32::MAX;
            assert!(
                graph
                    .add_record(&utf16("entry.ts"), &file.values(), &invalid, false)
                    .is_err(),
                "invalid value at {position}"
            );
        }
        for &position in &file.boolean_positions {
            let mut invalid = file.data.clone();
            invalid[position] = 2;
            assert!(
                graph
                    .add_record(&utf16("entry.ts"), &file.values(), &invalid, false)
                    .is_err()
            );
        }
        assert!(graph.usage.nodes.is_empty());
        assert!(graph.added_files.is_empty());
        let duplicate = Encoder::file(false, &[("leaf.ts", &imports), ("leaf.ts", &imports)]);
        assert!(
            graph
                .add_record(
                    &utf16("entry.ts"),
                    &duplicate.values(),
                    &duplicate.data,
                    false
                )
                .is_err()
        );
        assert!(graph.usage.nodes.is_empty());
        let mut with_suffix = file.data.clone();
        with_suffix.extend([u32::MAX, 123]);
        let paths = graph
            .add_record(&utf16("entry.ts"), &file.values(), &with_suffix, false)
            .unwrap();
        assert_eq!(
            paths.iter().map(|v| v.to_vec()).collect::<Vec<_>>(),
            vec![utf16("leaf.ts").to_vec()]
        );
        assert!(graph.ensure_finalized().is_err());
        assert!(
            graph
                .add_record(&utf16("entry.ts"), &file.values(), &file.data, false)
                .is_err()
        );
        graph.finish(vec![utf16("entry.ts")]).unwrap();
        assert!(graph.finish(Vec::new()).is_err());
        assert!(
            graph
                .add_record(&utf16("other.ts"), &file.values(), &file.data, false)
                .is_err()
        );
    }

    #[test]
    fn merges_preserve_source_alias_and_node_order() {
        let first = TestImports {
            refs: vec!["NS", "Color"],
            enumerated: Some(Vec::new()),
            imports: vec![("Fruit", vec!["first.ts"])],
            import_as: vec![("Fruit", vec![("Basket", vec!["first.ts"])])],
            import_ns: vec![("NS", vec!["first.ts"])],
            re_export: vec![("*", vec!["first.ts"])],
            re_export_as: vec![("Fruit", vec![("Public", vec!["first.ts"])])],
            re_export_ns: vec![("Tree", vec!["first.ts"])],
        };
        let second = TestImports {
            refs: vec!["NS.apple", "Color"],
            enumerated: Some(vec!["Color"]),
            imports: vec![
                ("Fruit", vec!["first.ts", "second.ts"]),
                ("Color", vec!["second.ts"]),
            ],
            import_as: vec![(
                "Fruit",
                vec![
                    ("Basket", vec!["second.ts", "first.ts"]),
                    ("Crate", vec!["second.ts"]),
                ],
            )],
            import_ns: vec![("NS", vec!["second.ts"])],
            re_export: vec![("*", vec!["second.ts"])],
            re_export_as: vec![(
                "Fruit",
                vec![("Public", vec!["second.ts"]), ("Second", vec!["second.ts"])],
            )],
            re_export_ns: vec![("Tree", vec!["second.ts"]), ("Other", vec!["second.ts"])],
        };
        let merged = TestImports {
            refs: vec!["NS", "Color", "NS.apple"],
            enumerated: Some(vec!["Color"]),
            imports: vec![
                ("Fruit", vec!["first.ts", "second.ts"]),
                ("Color", vec!["second.ts"]),
            ],
            import_as: vec![(
                "Fruit",
                vec![
                    ("Basket", vec!["first.ts", "second.ts"]),
                    ("Crate", vec!["second.ts"]),
                ],
            )],
            import_ns: vec![("NS", vec!["first.ts", "second.ts"])],
            re_export: vec![("*", vec!["first.ts", "second.ts"])],
            re_export_as: vec![(
                "Fruit",
                vec![
                    ("Public", vec!["first.ts", "second.ts"]),
                    ("Second", vec!["second.ts"]),
                ],
            )],
            re_export_ns: vec![
                ("Tree", vec!["first.ts", "second.ts"]),
                ("Other", vec!["second.ts"]),
            ],
        };
        let empty = TestImports::default();
        let mut graph = NativeProjectGraph::new();
        let paths = add_file(
            &mut graph,
            "first.ts",
            false,
            &Encoder::file(false, &[("leaf.ts", &first), ("empty.ts", &empty)]),
        );
        assert_eq!(
            paths.iter().map(|v| v.to_vec()).collect::<Vec<_>>(),
            vec![utf16("leaf.ts").to_vec(), utf16("empty.ts").to_vec()]
        );
        add_file(
            &mut graph,
            "second.ts",
            false,
            &Encoder::file(false, &[("leaf.ts", &second)]),
        );
        add_file(
            &mut graph,
            "leaf.ts",
            true,
            &Encoder::file(true, &[("leaf.ts", &empty)]),
        );
        graph
            .finish(vec![utf16("first.ts"), utf16("second.ts")])
            .unwrap();
        assert_eq!(
            graph
                .usage
                .nodes
                .keys()
                .map(|&id| String::from_utf16_lossy(graph.usage.strings.get(id)))
                .collect::<Vec<_>>(),
            ["leaf.ts", "empty.ts", "first.ts", "second.ts"]
        );
        let leaf = &graph.usage.nodes[&graph.usage.strings.lookup(&utf16("leaf.ts")).unwrap()];
        assert!(leaf.skip_exports && leaf.has_default_export);
        let actual = leaf.imported_by.as_ref().unwrap();
        let assert_sources = |actual: &Sources, expected: &TestSources| {
            assert_eq!(
                actual
                    .iter()
                    .map(|(&id, sources)| (
                        String::from_utf16_lossy(graph.usage.strings.get(id)),
                        sources
                            .iter()
                            .map(|&source| String::from_utf16_lossy(
                                graph.usage.strings.get(source)
                            ))
                            .collect::<Vec<_>>()
                    ))
                    .collect::<Vec<_>>(),
                expected
                    .iter()
                    .map(|(id, sources)| (
                        id.to_string(),
                        sources
                            .iter()
                            .map(|source| source.to_string())
                            .collect::<Vec<_>>()
                    ))
                    .collect::<Vec<_>>()
            );
        };
        assert_sources(&actual.imports, &merged.imports);
        assert_sources(&actual.import_ns, &merged.import_ns);
        assert_sources(&actual.re_export, &merged.re_export);
        assert_sources(&actual.re_export_ns, &merged.re_export_ns);
        for (actual, expected) in [
            (&actual.import_as, &merged.import_as),
            (&actual.re_export_as, &merged.re_export_as),
        ] {
            assert_eq!(actual.len(), expected.len());
            for ((&id, sources), (expected_id, expected_sources)) in actual.iter().zip(expected) {
                assert_eq!(graph.usage.strings.get(id), &*utf16(expected_id));
                assert_sources(sources, expected_sources);
            }
        }
        assert!(!actual.only_ns_refs);
        assert!(
            actual
                .member_namespaces
                .contains(&graph.usage.strings.lookup(&utf16("NS")).unwrap())
        );
        let expected = snapshot(
            &["first.ts", "second.ts"],
            &[
                ("leaf.ts", true, true, Some(&merged)),
                ("empty.ts", false, false, Some(&empty)),
                ("first.ts", false, false, None),
                ("second.ts", false, false, None),
            ],
        );
        assert_queries(
            &graph,
            &expected,
            &["leaf.ts", "empty.ts", "missing.ts"],
            &["Fruit", "Fruit.apple", "Color", "default", "missing", ""],
        );
        assert!(graph.imported_by(&utf16("empty.ts")).is_some());
        assert!(graph.imported_by(&utf16("first.ts")).is_none());
        assert!(graph.imported_by(&utf16("missing.ts")).is_none());
        assert!(graph.has_reference_record(&utf16("leaf.ts"), &utf16("NS.apple")));
        assert!(!graph.has_reference_record(&utf16("leaf.ts"), &utf16("apple")));
        assert!(graph.has_strictly_enum_reference_record(&utf16("leaf.ts"), &utf16("Color")));
        assert!(!graph.has_strictly_enum_reference_record(&utf16("leaf.ts"), &utf16("NS")));
        assert!(!graph.has_strictly_enum_reference_record(&utf16("missing.ts"), &utf16("Color")));
    }

    #[test]
    fn compact_queries_match_snapshots_across_aliases_namespaces_and_cycles() {
        let entry = TestImports {
            refs: vec!["Basket.apple", "Public", "NS", "Color"],
            enumerated: Some(vec!["Color"]),
            imports: vec![("Public", vec!["entry.ts"]), ("Color", vec!["entry.ts"])],
            import_as: vec![("Fruit", vec![("Basket", vec!["entry.ts"])])],
            import_ns: vec![("NS", vec!["entry.ts"])],
            ..TestImports::default()
        };
        let barrel = TestImports {
            re_export: vec![("*", vec!["barrel.ts"])],
            re_export_as: vec![("Fruit", vec![("Public", vec!["barrel.ts"])])],
            re_export_ns: vec![("Tree", vec!["barrel.ts"])],
            ..TestImports::default()
        };
        let barrel_cycle = TestImports {
            re_export: vec![("*", vec!["barrel.ts"])],
            ..TestImports::default()
        };
        let cycle = TestImports {
            re_export: vec![("*", vec!["cycle.ts"])],
            ..TestImports::default()
        };
        let second_entry = TestImports {
            re_export: vec![("Color", vec!["second-entry.ts"])],
            re_export_as: vec![("Fruit", vec![("Second", vec!["second-entry.ts"])])],
            ..TestImports::default()
        };
        let namespace = TestImports {
            refs: vec!["NS", "NS.apple"],
            import_ns: vec![("NS", vec!["consumer.ts"])],
            ..TestImports::default()
        };
        let leaf_reverse = TestImports {
            refs: vec!["NS", "NS.apple"],
            import_ns: vec![("NS", vec!["consumer.ts"])],
            re_export: vec![("*", vec!["barrel.ts"]), ("Color", vec!["second-entry.ts"])],
            re_export_as: vec![(
                "Fruit",
                vec![
                    ("Public", vec!["barrel.ts"]),
                    ("Second", vec!["second-entry.ts"]),
                ],
            )],
            re_export_ns: vec![("Tree", vec!["barrel.ts"])],
            ..TestImports::default()
        };
        let mut graph = NativeProjectGraph::new();
        add_file(
            &mut graph,
            "entry.ts",
            false,
            &Encoder::file(false, &[("barrel.ts", &entry)]),
        );
        add_file(
            &mut graph,
            "barrel.ts",
            false,
            &Encoder::file(false, &[("leaf.ts", &barrel), ("cycle.ts", &barrel_cycle)]),
        );
        add_file(
            &mut graph,
            "cycle.ts",
            false,
            &Encoder::file(false, &[("barrel.ts", &cycle)]),
        );
        add_file(
            &mut graph,
            "second-entry.ts",
            false,
            &Encoder::file(false, &[("leaf.ts", &second_entry)]),
        );
        add_file(
            &mut graph,
            "consumer.ts",
            false,
            &Encoder::file(false, &[("leaf.ts", &namespace)]),
        );
        add_file(&mut graph, "leaf.ts", false, &Encoder::file(false, &[]));
        graph
            .finish(vec![utf16("entry.ts"), utf16("second-entry.ts")])
            .unwrap();
        let barrel_reverse = TestImports {
            re_export: vec![("*", vec!["cycle.ts"])],
            ..entry
        };
        let expected = snapshot(
            &["entry.ts", "second-entry.ts"],
            &[
                ("barrel.ts", false, false, Some(&barrel_reverse)),
                ("entry.ts", false, false, None),
                ("leaf.ts", false, false, Some(&leaf_reverse)),
                ("cycle.ts", false, false, Some(&barrel_cycle)),
                ("second-entry.ts", false, false, None),
                ("consumer.ts", false, false, None),
            ],
        );
        assert_queries(
            &graph,
            &expected,
            &["leaf.ts", "barrel.ts", "cycle.ts", "entry.ts", "missing.ts"],
            &[
                "Fruit",
                "Fruit.apple",
                "apple",
                "Color",
                "default",
                "Public",
                "Tree.apple",
                "NS.apple",
                "missing",
                "",
            ],
        );
        let result = graph
            .usage
            .is_referenced(utf16("leaf.ts"), utf16("Fruit"), false, false);
        assert!(result.referenced);
        assert_eq!(
            result.entry_path.unwrap().to_vec(),
            utf16("second-entry.ts").to_vec()
        );
        assert_eq!(
            result
                .re_exported_ids
                .unwrap()
                .iter()
                .map(|v| v.to_vec())
                .collect::<Vec<_>>(),
            vec![utf16("Second").to_vec()]
        );
        assert!(graph.usage.is_enumerated(utf16("leaf.ts"), utf16("Color")));
        assert!(
            !graph
                .usage
                .has_strictly_ns_references(utf16("leaf.ts"), utf16("Fruit"))
                .referenced
        );
    }

    #[test]
    fn finalization_combines_namespace_refs_from_different_files() {
        let members = TestImports {
            refs: vec!["NS.member", "NS.deep.member"],
            imports: vec![("__opaque", vec!["members.ts"])],
            ..TestImports::default()
        };
        let namespace = TestImports {
            refs: vec!["NS", "NS.deep"],
            import_ns: vec![
                ("NS", vec!["namespace.ts"]),
                ("NS.deep", vec!["namespace.ts"]),
            ],
            ..TestImports::default()
        };
        let whole_namespace = TestImports {
            refs: vec!["NS"],
            imports: vec![("__opaque", vec!["namespace.ts"])],
            import_ns: vec![("NS", vec!["namespace.ts"])],
            ..TestImports::default()
        };
        for members_first in [true, false] {
            let mut graph = NativeProjectGraph::new();
            let records = if members_first {
                [("members.ts", &members), ("namespace.ts", &namespace)]
            } else {
                [("namespace.ts", &namespace), ("members.ts", &members)]
            };
            for (path, imports) in records {
                add_file(
                    &mut graph,
                    path,
                    false,
                    &Encoder::file(false, &[("leaf.ts", imports)]),
                );
            }
            add_file(
                &mut graph,
                "whole.ts",
                false,
                &Encoder::file(false, &[("whole-leaf.ts", &whole_namespace)]),
            );
            graph.finish(Vec::new()).unwrap();
            let imports = graph.imported_by(&utf16("leaf.ts")).unwrap();
            assert!(!imports.only_ns_refs);
            assert_eq!(imports.member_namespaces.len(), 2);
            assert!(
                graph
                    .usage
                    .is_referenced(utf16("leaf.ts"), utf16("other"), true, false)
                    .referenced
            );
            assert!(
                !graph
                    .usage
                    .is_referenced(utf16("whole-leaf.ts"), utf16("other"), true, false)
                    .referenced
            );
            assert_eq!(
                namespace_result(
                    graph
                        .usage
                        .has_strictly_ns_references(utf16("whole-leaf.ts"), utf16("other"))
                ),
                (true, Some(utf16("NS").to_vec()))
            );
        }
    }

    #[test]
    fn source_flags_replace_placeholders_without_losing_self_imports() {
        let loader = TestImports {
            imports: vec![("__loader-default", vec!["loader.ts"])],
            ..TestImports::default()
        };
        let empty = TestImports::default();
        let mut graph = NativeProjectGraph::new();
        add_file(
            &mut graph,
            "loader.ts",
            false,
            &Encoder::file(
                false,
                &[
                    ("default.ts", &loader),
                    ("named.ts", &loader),
                    ("skipped.ts", &empty),
                ],
            ),
        );
        add_file(&mut graph, "default.ts", true, &Encoder::file(false, &[]));
        add_file(&mut graph, "named.ts", false, &Encoder::file(false, &[]));
        add_file(&mut graph, "skipped.ts", false, &Encoder::file(true, &[]));
        add_file(
            &mut graph,
            "self.ts",
            true,
            &Encoder::file(true, &[("self.ts", &empty)]),
        );
        graph
            .finish(vec![
                utf16("skipped.ts"),
                utf16("self.ts"),
                utf16("absent.ts"),
            ])
            .unwrap();
        let expected = snapshot(
            &["skipped.ts", "self.ts", "absent.ts"],
            &[
                ("default.ts", false, true, Some(&loader)),
                ("named.ts", false, false, Some(&loader)),
                ("skipped.ts", true, false, Some(&empty)),
                ("loader.ts", false, false, None),
                ("self.ts", true, true, Some(&empty)),
            ],
        );
        assert_queries(
            &graph,
            &expected,
            &[
                "default.ts",
                "named.ts",
                "skipped.ts",
                "self.ts",
                "absent.ts",
            ],
            &["default", "named", ""],
        );
        assert!(
            !graph
                .usage
                .is_referenced(utf16("default.ts"), utf16("named"), true, false)
                .referenced
        );
        assert!(
            graph
                .usage
                .is_referenced(utf16("default.ts"), utf16("default"), true, false)
                .referenced
        );
        assert!(
            graph
                .usage
                .is_referenced(utf16("named.ts"), utf16("named"), true, false)
                .referenced
        );
        assert!(
            graph
                .usage
                .is_referenced(utf16("skipped.ts"), utf16("named"), true, false)
                .referenced
        );
        assert!(graph.imported_by(&utf16("self.ts")).is_some());
    }

    #[test]
    fn compact_symbols_preserve_utf16_and_skip_unused_strings() {
        let path = [47, 0xd800, 46, 116, 115];
        let identifier = [0xdc00];
        let values = vec![
            path.to_vec().into(),
            identifier.to_vec().into(),
            vec![0xdc00, 46, 0xd800].into(),
            utf16("entry.ts"),
            utf16("unused-export"),
        ];
        let mut graph = NativeProjectGraph::new();
        graph
            .add_record(
                &utf16("entry.ts"),
                &values,
                &[0, 1, 0, 2, 1, 2, 0, 1, 1, 1, 3, 0, 0, 0, 0, 0],
                false,
            )
            .unwrap();
        graph.finish(Vec::new()).unwrap();
        assert!(
            graph
                .usage
                .strings
                .lookup(&utf16("unused-export"))
                .is_none()
        );
        assert!(graph.has_reference_record(&path, &identifier));
        assert!(!graph.has_strictly_enum_reference_record(&path, &identifier));
        assert!(
            graph
                .usage
                .is_referenced(
                    path.to_vec().into(),
                    identifier.to_vec().into(),
                    true,
                    false
                )
                .referenced
        );
    }
}
