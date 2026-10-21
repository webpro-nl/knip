use super::{common::decode_utf16, state::*};
use napi::bindgen_prelude::{Uint32Array, Utf16String};
use napi_derive::napi;
use std::collections::HashMap;

#[napi(object, object_from_js = false)]
pub struct CompactFile {
    pub strings: Vec<Utf16String>,
    pub data: Uint32Array,
}

#[derive(Debug, PartialEq, Eq)]
pub struct RawCompactFile {
    pub strings: Vec<Vec<u16>>,
    pub data: Vec<u32>,
}

impl From<RawCompactFile> for CompactFile {
    fn from(file: RawCompactFile) -> Self {
        Self {
            strings: file.strings.into_iter().map(Into::into).collect(),
            data: file.data.into(),
        }
    }
}
#[derive(Default)]
struct Encoder {
    ids: HashMap<String, u32>,
    strings: Vec<Vec<u16>>,
    data: Vec<u32>,
    tag_ids: HashMap<usize, u32>,
}
impl Encoder {
    fn string(&mut self, value: String) {
        let id = match self.ids.get(&value) {
            Some(id) => *id,
            None => {
                let id = self.strings.len() as u32;
                self.strings.push(decode_utf16(&value));
                self.ids.insert(value, id);
                id
            }
        };
        self.data.push(id);
    }
    fn bool(&mut self, value: bool) {
        self.data.push(u32::from(value));
    }
    fn number(&mut self, value: u32) {
        self.data.push(value);
    }
    fn symbol_type(&mut self, value: &str) {
        self.number(match value {
            "class" => 0,
            "enum" => 1,
            "function" => 2,
            "interface" => 3,
            "member" => 4,
            "namespace" => 5,
            "type" => 6,
            "unknown" => 7,
            "variable" => 8,
            _ => unreachable!("Invalid native symbol type"),
        });
    }
    fn array<I: IntoIterator>(&mut self, values: I, emit: impl Fn(&mut Self, I::Item)) {
        let index = self.data.len();
        self.data.push(0);
        let mut count = 0;
        for value in values {
            emit(self, value);
            count += 1;
        }
        self.data[index] = count;
    }
    fn option<T>(&mut self, value: Option<T>, emit: impl Fn(&mut Self, T)) {
        self.bool(value.is_some());
        if let Some(value) = value {
            emit(self, value);
        }
    }
    fn strings(&mut self, values: Strings) {
        self.array(values, Self::string);
    }
    fn tags(&mut self, tags: Tags) {
        if tags.is_empty() {
            self.number(0);
            return;
        }
        let identity = tags.identity();
        if let Some(id) = self.tag_ids.get(&identity) {
            self.number(*id);
        } else {
            let id = self.tag_ids.len() as u32 + 1;
            self.tag_ids.insert(identity, id);
            self.number(id);
            if let Some(values) = tags.values() {
                self.array(values.iter().cloned(), Self::string);
            }
        }
    }
    fn ids(&mut self, values: IdMap) {
        self.array(values, |s, (id, values)| {
            s.string(id);
            s.strings(values);
        });
    }
    fn namespaces(&mut self, values: NsMap) {
        self.array(values, |s, (id, values)| {
            s.string(id);
            s.ids(values);
        });
    }
    fn maps(&mut self, m: ImportMaps) {
        self.strings(m.refs);
        self.option(m.enumerated, Self::strings);
        self.ids(m.import);
        self.namespaces(m.import_as);
        self.ids(m.import_ns);
        self.ids(m.re_export);
        self.ids(m.re_export_ns);
        self.namespaces(m.re_export_as);
    }
    fn import(&mut self, i: Import) {
        self.string(i.specifier);
        self.option(i.file_path, Self::string);
        self.option(i.identifier, Self::string);
        self.option(i.alias, Self::string);
        self.number(i.pos);
        self.number(i.line);
        self.number(i.col);
        self.bool(i.is_type_only);
        self.number(i.modifiers);
        self.option(i.js_doc_tags, Self::tags);
    }
    fn member(&mut self, m: ExportMember) {
        self.string(m.identifier);
        self.symbol_type(&m.r#type);
        self.number(m.pos);
        self.number(m.line);
        self.number(m.col);
        self.option(m.fix, |s, v| s.array(v, Self::number));
        self.tags(m.js_doc_tags);
        self.number(m.flags);
        self.bool(m.has_refs_in_file);
    }
    fn export(&mut self, e: Export) {
        self.string(e.identifier);
        self.string(e.binding);
        self.symbol_type(&e.r#type);
        self.number(e.pos);
        self.number(e.line);
        self.number(e.col);
        self.array(e.members, Self::member);
        self.tags(e.js_doc_tags);
        self.bool(e.has_refs_in_file);
        self.bool(e.is_registered);
        self.option(e.referenced_in, Self::strings);
        self.array(e.fixes, |s, v| s.array(v, Self::number));
        self.bool(e.is_re_export);
        self.bool(e.is_binding_re_export);
    }
    fn symbol(&mut self, i: IssueSymbol) {
        self.string(i.symbol);
        self.number(i.pos);
        self.number(i.line);
        self.number(i.col);
    }
    fn glob(&mut self, g: ImportGlob) {
        self.array(g.patterns, Self::string);
        self.option(g.base, Self::string);
        self.option(g.cwd, Self::string);
        self.option(g.filter, |s, (pattern, flags)| {
            s.string(pattern);
            s.string(flags);
        });
        self.option(g.analyze_exports, Self::bool);
    }
}
pub fn file(state: State<'_, '_>) -> RawCompactFile {
    let mut s = Encoder::default();
    s.bool(state.skip_exports);
    s.array(state.internal, |s, (path, map)| {
        s.string(path);
        s.maps(map);
    });
    s.array(state.external, Encoder::import);
    s.array(state.unresolved, Encoder::import);
    s.array(state.imports, Encoder::import);
    s.strings(state.program_files);
    s.strings(state.entry_files);
    s.array(state.exports, |s, (name, item)| {
        s.string(name);
        s.export(item);
    });
    s.array(state.aliased_exports.into_values(), |s, items| {
        s.array(items, Encoder::symbol)
    });
    s.strings(state.scripts);
    s.array(state.import_globs, Encoder::glob);
    RawCompactFile {
        strings: s.strings,
        data: s.data,
    }
}
