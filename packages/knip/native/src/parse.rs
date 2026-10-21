use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;
use oxc_allocator::Allocator;
use oxc_parser::{ParseOptions, Parser, ParserReturn};
use oxc_span::SourceType;

pub fn parser_text(source: &[u16], wasi_parser: bool) -> String {
    if !wasi_parser {
        return String::from_utf16_lossy(source);
    }
    let mut text = String::with_capacity(source.len());
    let mut units = source.iter().copied();
    while let Some(unit) = units.next() {
        let codepoint = if (0xd800..=0xdfff).contains(&unit) {
            (0x10000 + ((u32::from(unit) & 0x3ff) << 10))
                | (u32::from(units.next().unwrap_or(0)) & 0x3ff)
        } else {
            u32::from(unit)
        };
        text.push(char::from_u32(codepoint).unwrap());
    }
    text
}

pub fn parse_source<'a>(
    allocator: &'a Allocator,
    file_path: &[u16],
    source_text: &'a str,
    wasi_parser: bool,
) -> ParserReturn<'a> {
    let extension = crate::resolver::path::extname(file_path);
    let known_extension = matches!(
        String::from_utf16_lossy(&extension).as_str(),
        ".js" | ".mjs" | ".cjs" | ".jsx" | ".ts" | ".tsx" | ".mts" | ".cts"
    );
    let mut normalized;
    let file_path = if known_extension {
        file_path
    } else {
        normalized = file_path.to_vec();
        normalized.extend([46, 116, 115]);
        &normalized
    };
    let file_path = parser_text(file_path, wasi_parser);
    let source_type = SourceType::from_path(&file_path)
        .unwrap_or_else(|_| SourceType::mjs())
        .with_unambiguous(true);
    Parser::new(allocator, source_text, source_type)
        .with_options(ParseOptions {
            enable_ident_hashes: false,
            ..ParseOptions::default()
        })
        .parse()
}

#[napi]
pub fn is_ambient_declaration_file(
    file_path: Utf16String,
    source_utf16: Utf16String,
    wasi_parser: Option<bool>,
) -> bool {
    let wasi_parser = wasi_parser.unwrap_or(false);
    let source_text = parser_text(&source_utf16, wasi_parser);
    let allocator = Allocator::default();
    let result = parse_source(&allocator, &file_path, &source_text, wasi_parser);
    result.module_record.local_export_entries.is_empty()
        && result.module_record.indirect_export_entries.is_empty()
        && result.module_record.star_export_entries.is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wasi_conversion_consumes_one_unit_after_every_surrogate() {
        for (units, codepoints) in [
            (vec![0xd800, 0x22], vec![0x10022]),
            (vec![0xdfff, 0x58], vec![0x10fc58]),
            (vec![0xd800, 0xd800, 0xdc00, 0xdc00], vec![0x10000, 0x10000]),
            (vec![0xd800], vec![0x10000]),
            (
                vec![0x61, 0xd83c, 0xdf4e, 0xfffd],
                vec![0x61, 0x1f34e, 0xfffd],
            ),
        ] {
            assert_eq!(
                parser_text(&units, true)
                    .chars()
                    .map(u32::from)
                    .collect::<Vec<_>>(),
                codepoints
            );
            assert_eq!(parser_text(&units, false), String::from_utf16_lossy(&units));
        }
    }
}
