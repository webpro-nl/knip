use std::sync::LazyLock;

use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;
use oxc_allocator::Allocator;
use oxc_ast::{Comment, ast::Program};
use oxc_parser::{ParseOptions, Parser};
use oxc_span::{GetSpan, SourceType};
use oxc_syntax::module_record::ImportImportName;
use regex::Regex;

use crate::{
    parse::{parse_source, parser_text},
    positions::SourcePositions,
};

const TYPE_ONLY: u32 = 1 << 1;
const ENTRY: u32 = 1 << 2;
const OPTIONAL: u32 = 1 << 4;
const OPAQUE: u32 = 1 << 6;
const JS_WHITESPACE: &str = r"\t\n\x0b\x0c\r \u{00a0}\u{1680}\u{2000}-\u{200a}\u{2028}\u{2029}\u{202f}\u{205f}\u{3000}\u{feff}";

static JSDOC_IMPORT: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(&format!(
        r#"import\([{JS_WHITESPACE}]*['"]([^'"]+)['"][{JS_WHITESPACE}]*\)(?:\.([A-Za-z0-9_]+))?"#
    ))
    .unwrap()
});
static JSDOC_TYPE_TAG: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"@(?:type|typedef|callback|param|arg|argument|property|prop|returns?|yields?|throws?|exception|this|extends|augments|implements|enum|template|satisfies|const|constant|member|var|namespace|module)(?-u:\b)").unwrap()
});
static JSX_IMPORT_SOURCE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(&format!(
        r"@jsxImportSource[{JS_WHITESPACE}]+([^{JS_WHITESPACE}]+)"
    ))
    .unwrap()
});
static REFERENCE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(&format!(
        r#"[{JS_WHITESPACE}]*<reference[{JS_WHITESPACE}]+(types|path)[{JS_WHITESPACE}]*=[{JS_WHITESPACE}]*"([^"]+)"[^/]*\/>"#
    ))
    .unwrap()
});
static ENV_PRAGMA: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(&format!(
        r"@(vitest|jest)-environment[{JS_WHITESPACE}]+([@A-Za-z0-9_./-]+)"
    ))
    .unwrap()
});

#[napi(object)]
#[derive(Debug)]
pub struct ImportRequest {
    pub specifier: Utf16String,
    pub identifier: Option<String>,
    pub alias: Option<String>,
    pub namespace: Option<String>,
    pub pos: u32,
    pub modifiers: u32,
    pub specifier_pos: Option<u32>,
    pub js_doc_tags: Option<Vec<String>>,
}

impl ImportRequest {
    fn new(specifier: Utf16String, pos: u32, modifiers: u32) -> Self {
        Self {
            specifier,
            identifier: None,
            alias: None,
            namespace: None,
            pos,
            modifiers,
            specifier_pos: None,
            js_doc_tags: None,
        }
    }
}

fn is_whitespace(byte: u8) -> bool {
    matches!(byte, b'\t' | b'\n' | b'\r' | b' ')
}

fn is_horizontal_whitespace(byte: u8) -> bool {
    matches!(byte, b'\t' | b'\r' | b' ')
}

fn is_jsdoc_tag_start(text: &str, index: usize) -> bool {
    let bytes = text.as_bytes();
    let mut pos = text[..index].rfind('\n').map_or(0, |pos| pos + 1);
    while bytes.get(pos).is_some_and(|byte| is_whitespace(*byte)) {
        pos += 1;
    }
    if bytes.get(pos) == Some(&b'*') {
        pos += 1;
        while bytes.get(pos).is_some_and(|byte| is_whitespace(*byte)) {
            pos += 1;
        }
    }
    pos == index
}

fn jsdoc_import_source(text: &str, index: usize) -> String {
    let bytes = text.as_bytes();
    let mut source = String::from("import type");
    let mut pos = index + "@import".len();
    while pos < text.len() {
        let Some(relative_end) = text[pos..].find('\n') else {
            source.push_str(&text[pos..]);
            break;
        };
        let line_end = pos + relative_end;
        source.push_str(&text[pos..line_end]);
        let mut next_line = line_end + 1;
        while bytes
            .get(next_line)
            .is_some_and(|byte| is_horizontal_whitespace(*byte))
        {
            next_line += 1;
        }
        if bytes.get(next_line) == Some(&b'*') {
            next_line += 1;
            while bytes
                .get(next_line)
                .is_some_and(|byte| is_horizontal_whitespace(*byte))
            {
                next_line += 1;
            }
        }
        if bytes.get(next_line) == Some(&b'@') {
            break;
        }
        source.push('\n');
        pos = next_line;
    }
    source
}

fn is_in_jsdoc_type_expression(text: &str, index: usize) -> bool {
    let mut depth = 0;
    for pos in (0..index).rev() {
        match text.as_bytes()[pos] {
            b'}' => depth += 1,
            b'{' if depth > 0 => depth -= 1,
            b'{' => {
                let start = text[..pos].rfind('\n').map_or(0, |index| index + 1);
                if JSDOC_TYPE_TAG.is_match(&text[start..pos]) {
                    return true;
                }
            }
            _ => {}
        }
    }
    false
}

fn add_jsdoc_import(text: &str, index: usize, pos: u32, imports: &mut Vec<ImportRequest>) {
    let source = jsdoc_import_source(text, index);
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, &source, SourceType::ts().with_module(true))
        .with_options(ParseOptions {
            enable_ident_hashes: false,
            ..ParseOptions::default()
        })
        .parse();
    let mut first_request = None;
    for (name, requests) in &parsed.module_record.requested_modules {
        for request in requests {
            if request.is_import
                && first_request
                    .as_ref()
                    .is_none_or(|(_, start)| request.statement_span.start < *start)
            {
                first_request = Some((name.as_str(), request.statement_span.start));
            }
        }
    }
    let Some((specifier, statement_start)) = first_request else {
        return;
    };
    if specifier.is_empty() {
        return;
    }
    let previous_length = imports.len();
    for entry in &parsed.module_record.import_entries {
        if entry.statement_span.start != statement_start {
            continue;
        }
        let mut import = ImportRequest::new(specifier.to_owned().into(), pos, TYPE_ONLY);
        let identifier = match &entry.import_name {
            ImportImportName::NamespaceObject => {
                import.modifiers |= OPAQUE;
                None
            }
            ImportImportName::Default(_) => Some("default"),
            ImportImportName::Name(name) => Some(name.name.as_str()),
        };
        if let Some(identifier) = identifier {
            import.identifier = Some(identifier.to_owned());
            if entry.local_name.name != identifier {
                import.alias = Some(entry.local_name.name.to_string());
            }
        }
        imports.push(import);
    }
    if imports.len() == previous_length {
        imports.push(ImportRequest::new(
            specifier.to_owned().into(),
            pos,
            TYPE_ONLY,
        ));
    }
}

pub fn extract_imports_from_comments(
    program: &Program<'_>,
    positions: &SourcePositions,
    raw_source: Option<&[u16]>,
) -> Vec<ImportRequest> {
    let first_stmt_start = program.directives.first().map_or_else(
        || {
            program
                .body
                .first()
                .map_or(u32::MAX, |stmt| stmt.span().start)
        },
        |directive| directive.span.start,
    );
    let mut imports = Vec::new();
    for comment in &program.comments {
        let content_span = comment.content_span();
        let text = content_span.source_text(program.source_text);
        let comment_start = positions.utf16_offset(comment.span.start);
        let comment_pos = |index: usize| {
            positions.utf16_offset(content_span.start + index as u32)
                - (content_span.start - comment.span.start)
        };
        let captured_specifier = |capture: regex::Match<'_>| {
            if let Some(source) = raw_source {
                let start = positions.utf16_offset(content_span.start + capture.start() as u32);
                let end = positions.utf16_offset(content_span.start + capture.end() as u32);
                source[start as usize..end as usize].to_vec().into()
            } else {
                capture.as_str().to_owned().into()
            }
        };

        if comment.is_block() {
            for captures in JSDOC_IMPORT.captures_iter(text) {
                let index = captures.get(0).unwrap().start();
                if !is_in_jsdoc_type_expression(text, index) {
                    continue;
                }
                let mut import = ImportRequest::new(
                    captured_specifier(captures.get(1).unwrap()),
                    comment_pos(index),
                    TYPE_ONLY,
                );
                import.identifier = captures.get(2).map(|capture| capture.as_str().to_owned());
                imports.push(import);
            }
            for (index, _) in text.match_indices("@import") {
                if is_jsdoc_tag_start(text, index)
                    && text
                        .as_bytes()
                        .get(index + "@import".len())
                        .is_some_and(|byte| is_whitespace(*byte))
                {
                    add_jsdoc_import(text, index, comment_pos(index), &mut imports);
                }
            }
        }

        if let Some(captures) = JSX_IMPORT_SOURCE.captures(text) {
            imports.push(ImportRequest::new(
                captured_specifier(captures.get(1).unwrap()),
                comment_start,
                TYPE_ONLY,
            ));
        }

        if comment.span.end <= first_stmt_start {
            for captures in ENV_PRAGMA.captures_iter(text) {
                let value = &captures[2];
                let specifier = match (&captures[1], value) {
                    (_, "node") => continue,
                    ("jest", "jsdom") => "jest-environment-jsdom",
                    ("vitest", "edge-runtime") => "@edge-runtime/vm",
                    _ => value,
                };
                let modifiers = if specifier.starts_with(['.', '/']) {
                    ENTRY
                } else {
                    0
                };
                let pos = comment_pos(captures.get(0).unwrap().start());
                imports.push(ImportRequest::new(
                    specifier.to_owned().into(),
                    pos,
                    modifiers,
                ));
            }
        }

        if comment.is_line()
            && let Some(captures) = REFERENCE.captures(text)
        {
            let modifiers = TYPE_ONLY | if &captures[1] == "path" { OPTIONAL } else { 0 };
            imports.push(ImportRequest::new(
                captured_specifier(captures.get(2).unwrap()),
                comment_start,
                modifiers,
            ));
        }
    }
    imports
}

#[derive(Debug)]
struct JSDocTagEntry {
    reach: u32,
    tags: Vec<String>,
}

#[derive(Debug)]
pub struct JSDocTagLookup {
    entries: Vec<JSDocTagEntry>,
}

impl JSDocTagLookup {
    pub fn new(
        comments: &[Comment],
        source: &str,
        original: &[u16],
        positions: &SourcePositions,
    ) -> Self {
        let mut entries: Vec<JSDocTagEntry> = Vec::new();
        let mut reach = original.len() as u32;
        for (index, comment) in comments.iter().enumerate().rev() {
            let mut end = positions.utf16_offset(comment.span.end) as usize;
            while original
                .get(end)
                .is_some_and(|unit| matches!(unit, 32 | 9 | 10 | 13))
            {
                end += 1;
            }
            if comments
                .get(index + 1)
                .map(|next| positions.utf16_offset(next.span.start))
                != Some(end as u32)
            {
                reach = end as u32;
            }

            let text = comment.content_span().source_text(source);
            if !text.contains('@') {
                continue;
            }
            if comment.is_line() {
                let mut start = positions.utf16_offset(comment.span.start) as usize;
                while start > 0 && matches!(original.get(start - 1), Some(32 | 9)) {
                    start -= 1;
                }
                if start > 0 && !matches!(original.get(start - 1), Some(10 | 13)) {
                    continue;
                }
            }

            let mut tags = Vec::new();
            for (index, _) in text.match_indices('@') {
                let mut end = index + 1;
                while text
                    .as_bytes()
                    .get(end)
                    .is_some_and(|byte| byte.is_ascii_alphanumeric() || *byte == b'_')
                {
                    end += 1;
                }
                if end > index + 1 {
                    let tag = &text[index..end];
                    if !tags.iter().any(|existing| existing == tag) {
                        tags.push(tag.to_owned());
                    }
                }
            }
            if tags.is_empty() {
                continue;
            }
            if let Some(entry) = entries.last_mut().filter(|entry| entry.reach == reach) {
                for tag in tags {
                    if !entry.tags.contains(&tag) {
                        entry.tags.push(tag);
                    }
                }
            } else {
                entries.push(JSDocTagEntry { reach, tags });
            }
        }
        entries.reverse();
        Self { entries }
    }

    pub fn get(&self, node_start: u32) -> &[String] {
        match self
            .entries
            .binary_search_by_key(&node_start, |entry| entry.reach)
        {
            Ok(index) => &self.entries[index].tags,
            Err(_) => &[],
        }
    }
}

#[napi(object)]
pub struct NativeCommentAnalysis {
    pub imports: Vec<ImportRequest>,
    pub tags: Vec<Vec<String>>,
}

#[napi]
pub fn analyze_comments(
    file_path: Utf16String,
    source_utf16: Utf16String,
    node_starts: Option<Vec<u32>>,
    raw_comments: Option<bool>,
    wasi_parser: Option<bool>,
) -> NativeCommentAnalysis {
    let wasi_parser = wasi_parser.unwrap_or(false);
    let source_text = parser_text(&source_utf16, wasi_parser);
    let allocator = Allocator::default();
    let parsed = parse_source(&allocator, &file_path, &source_text, wasi_parser);
    let positions =
        SourcePositions::with_original(&source_text, wasi_parser.then_some(&*source_utf16));
    let imports = extract_imports_from_comments(
        &parsed.program,
        &positions,
        raw_comments.unwrap_or(false).then_some(&*source_utf16),
    );
    let lookup = JSDocTagLookup::new(
        &parsed.program.comments,
        &source_text,
        &source_utf16,
        &positions,
    );
    let mut tags = Vec::new();
    if let Some(node_starts) = node_starts {
        tags.reserve(node_starts.len());
        for start in node_starts {
            tags.push(lookup.get(start).to_vec());
        }
    }
    NativeCommentAnalysis { imports, tags }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn imports(source: &str) -> Vec<ImportRequest> {
        analyze_comments(
            "module.ts".to_owned().into(),
            source.to_owned().into(),
            None,
            None,
            None,
        )
        .imports
    }

    #[test]
    fn preserves_import_order_flags_aliases_and_utf16_positions() {
        let source = "/** 🍎 @jest-environment jsdom\n * @import Default, { Named as Local } from 'types'\n * @type {import('nested').Member}\n * @jsxImportSource preact\n */\n/// <reference path=\"./types.d.ts\" />\nexport {};";
        let actual = imports(source);
        let expected = [
            (
                "nested",
                Some("Member"),
                None,
                TYPE_ONLY,
                "import('nested')",
            ),
            (
                "types",
                Some("default"),
                Some("Default"),
                TYPE_ONLY,
                "@import",
            ),
            ("types", Some("Named"), Some("Local"), TYPE_ONLY, "@import"),
            ("preact", None, None, TYPE_ONLY, "/**"),
            ("jest-environment-jsdom", None, None, 0, "@jest"),
            ("./types.d.ts", None, None, TYPE_ONLY | OPTIONAL, "///"),
        ];
        assert_eq!(actual.len(), expected.len());
        for (actual, (specifier, identifier, alias, modifiers, marker)) in
            actual.iter().zip(expected)
        {
            let mut pos = source[..source.find(marker).unwrap()]
                .encode_utf16()
                .count() as u32;
            if !matches!(marker, "/**" | "///") {
                pos -= 2;
            }
            assert_eq!(actual.specifier.to_string(), specifier);
            assert_eq!(actual.identifier.as_deref(), identifier);
            assert_eq!(actual.alias.as_deref(), alias);
            assert_eq!(actual.pos, pos);
            assert_eq!(actual.modifiers, modifiers);
            assert_eq!(actual.namespace, None);
            assert_eq!(actual.specifier_pos, None);
            assert_eq!(actual.js_doc_tags, None);
        }
    }

    #[test]
    fn keeps_module_records_when_synthetic_import_ast_is_discarded() {
        let actual = imports("/** @import { Named as Local } from 'types'; broken { */");
        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].specifier.to_string(), "types");
        assert_eq!(actual[0].identifier.as_deref(), Some("Named"));
        assert_eq!(actual[0].alias.as_deref(), Some("Local"));
        assert_eq!(
            imports("/** @import 'types' */")[0].specifier.to_string(),
            "types"
        );
        assert!(imports("/** @import {} from ''; import { Other } from 'other' */").is_empty());
    }

    #[test]
    fn preserves_namespace_opacity_and_multiline_tag_boundaries() {
        let source = "/**\r\n * @import\r\n * * as Types\r\n * from 'types'\r\n * @type {import('next').Value}\r\n */";
        let actual = imports(source);
        assert_eq!(actual.len(), 2);
        assert_eq!(actual[0].specifier.to_string(), "next");
        assert_eq!(actual[1].specifier.to_string(), "types");
        assert_eq!(actual[1].modifiers, TYPE_ONLY | OPAQUE);
        assert_eq!(actual[1].identifier, None);
        assert_eq!(actual[1].alias, None);
        assert_eq!(actual[1].namespace, None);
    }

    #[test]
    fn gates_environment_pragmas_on_directives_and_keeps_local_entries() {
        let source = "// @vitest-environment node @vitest-environment ./local @vitest-environment edge-runtime\n'use strict';\n// @jest-environment ignored";
        let actual = imports(source);
        assert_eq!(actual.len(), 2);
        assert_eq!(actual[0].specifier.to_string(), "./local");
        assert_eq!(actual[0].modifiers, ENTRY);
        assert_eq!(actual[1].specifier.to_string(), "@edge-runtime/vm");
    }

    #[test]
    fn reproduces_javascript_regex_character_classes_and_quote_matching() {
        let source = "/** @typeé {import(\u{feff}'bom').Météo} @type {import(\u{0085}'nel')} @type {import('mixed\")} */\n// @jsxImportSource\u{feff}preact\u{0085}tail";
        let actual = imports(source);
        assert_eq!(actual.len(), 3);
        assert_eq!(actual[0].specifier.to_string(), "bom");
        assert_eq!(actual[0].identifier.as_deref(), Some("M"));
        assert_eq!(actual[1].specifier.to_string(), "mixed");
        assert_eq!(actual[2].specifier.to_string(), "preact\u{0085}tail");
    }

    #[test]
    fn excludes_prose_examples_and_closed_type_expressions() {
        let source = "/** mention @import { Named } from 'prose'\n * @example {import('example')}\n * @type {string} import('outside')\n * @typeX {import('prefix')}\n * @param {{nested: import('inside').Value}} value\n */";
        let actual = imports(source);
        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].specifier.to_string(), "inside");
    }

    #[test]
    fn tags_reach_declarations_in_nearest_comment_first_order() {
        let source = "/* 🍎 @first @shared */\r\n// @second @shared\r\n// explanation\r\nexport const value = 1; // @ignored\r\nexport const next = 2;";
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, source, SourceType::ts()).parse();
        let positions = SourcePositions::new(source);
        let lookup = JSDocTagLookup::new(
            &parsed.program.comments,
            source,
            &source.encode_utf16().collect::<Vec<_>>(),
            &positions,
        );
        assert_eq!(
            lookup.get(positions.utf16_offset(parsed.program.body[0].span().start)),
            ["@second", "@shared", "@first"]
        );
        assert!(
            lookup
                .get(positions.utf16_offset(parsed.program.body[1].span().start))
                .is_empty()
        );
        assert!(
            lookup
                .get(positions.utf16_offset(parsed.program.body[0].span().start) + 1)
                .is_empty()
        );
    }

    #[test]
    fn tags_keep_ascii_names_and_do_not_cross_nonstandard_whitespace() {
        let source = "/* @A @a @_ @123 @a-b @é @🍎 */\u{feff}export const value = 1;";
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, source, SourceType::ts()).parse();
        let positions = SourcePositions::new(source);
        let lookup = JSDocTagLookup::new(
            &parsed.program.comments,
            source,
            &source.encode_utf16().collect::<Vec<_>>(),
            &positions,
        );
        assert!(
            lookup
                .get(positions.utf16_offset(parsed.program.body[0].span().start))
                .is_empty()
        );
        assert_eq!(
            lookup.get(positions.utf16_offset(parsed.program.comments[0].span.end)),
            ["@A", "@a", "@_", "@123"]
        );
    }
}
