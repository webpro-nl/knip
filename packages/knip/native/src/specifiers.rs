use std::sync::LazyLock;

use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, CallExpression, Expression, FormalParameter, FormalParameterRest, MethodDefinition,
    MethodDefinitionKind, MethodDefinitionType, TSImportEqualsDeclaration, TSModuleReference,
};
use oxc_ast_visit::{Visit, walk};
use oxc_syntax::scope::ScopeFlags;
use regex::Regex;

use crate::{
    parse::{parse_source, parser_text},
    positions::SourcePositions,
};

static COMMENT_IMPORT: LazyLock<Regex> = LazyLock::new(|| {
    let whitespace = r"[\t\n\x0b\x0c\r \u{00a0}\u{1680}\u{2000}-\u{200a}\u{2028}\u{2029}\u{202f}\u{205f}\u{3000}\u{feff}]";
    Regex::new(&format!(
        r#"import\({whitespace}*['"]([^'"]+)['"]{whitespace}*\)"#
    ))
    .unwrap()
});

struct RequireVisitor<'s> {
    specifiers: &'s mut Vec<Utf16String>,
    is_typescript: bool,
}

fn literal_value(value: &str, lone_surrogates: bool) -> Utf16String {
    let mut units = value.encode_utf16();
    let mut decoded = Vec::with_capacity(value.len());
    while let Some(unit) = units.next() {
        if unit == 0xfffd && lone_surrogates {
            let mut surrogate = 0;
            for _ in 0..4 {
                let digit = units.next().unwrap();
                surrogate = (surrogate << 4)
                    | char::from_u32(u32::from(digit))
                        .unwrap()
                        .to_digit(16)
                        .unwrap() as u16;
            }
            decoded.push(surrogate);
        } else {
            decoded.push(unit);
        }
    }
    decoded.into()
}

impl<'a> Visit<'a> for RequireVisitor<'_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        let is_require = match &call.callee {
            Expression::Identifier(identifier) => identifier.name == "require",
            Expression::StaticMemberExpression(member) => {
                member.property.name == "resolve"
                    && matches!(&member.object, Expression::Identifier(identifier) if identifier.name == "require")
            }
            Expression::PrivateFieldExpression(member) => {
                member.field.name == "resolve"
                    && matches!(&member.object, Expression::Identifier(identifier) if identifier.name == "require")
            }
            _ => false,
        };
        if is_require {
            match call.arguments.first() {
                Some(Argument::StringLiteral(literal)) => {
                    self.specifiers
                        .push(literal_value(&literal.value, literal.lone_surrogates));
                }
                Some(Argument::TemplateLiteral(template))
                    if template.expressions.is_empty() && template.quasis.len() == 1 =>
                {
                    let value = &template.quasis[0].value;
                    self.specifiers.push(literal_value(
                        &value.cooked.unwrap_or(value.raw),
                        value.cooked.is_some() && template.quasis[0].lone_surrogates,
                    ));
                }
                _ => {}
            }
        }
        walk::walk_call_expression(self, call);
    }

    fn visit_ts_import_equals_declaration(&mut self, declaration: &TSImportEqualsDeclaration<'a>) {
        if let TSModuleReference::ExternalModuleReference(reference) = &declaration.module_reference
        {
            self.specifiers.push(literal_value(
                &reference.expression.value,
                reference.expression.lone_surrogates,
            ));
        }
        walk::walk_ts_import_equals_declaration(self, declaration);
    }

    fn visit_method_definition(&mut self, method: &MethodDefinition<'a>) {
        if method.r#type != MethodDefinitionType::TSAbstractMethodDefinition {
            self.visit_decorators(&method.decorators);
        }
        self.visit_property_key(&method.key);
        let flags = match method.kind {
            MethodDefinitionKind::Get => ScopeFlags::Function | ScopeFlags::GetAccessor,
            MethodDefinitionKind::Set => ScopeFlags::Function | ScopeFlags::SetAccessor,
            MethodDefinitionKind::Constructor => ScopeFlags::Function | ScopeFlags::Constructor,
            MethodDefinitionKind::Method => ScopeFlags::Function,
        };
        self.visit_function(&method.value, flags);
    }

    fn visit_formal_parameter(&mut self, parameter: &FormalParameter<'a>) {
        if self.is_typescript {
            walk::walk_formal_parameter(self, parameter);
        } else {
            self.visit_binding_pattern(&parameter.pattern);
            if let Some(initializer) = &parameter.initializer {
                self.visit_expression(initializer);
            }
        }
    }

    fn visit_formal_parameter_rest(&mut self, parameter: &FormalParameterRest<'a>) {
        if self.is_typescript {
            walk::walk_formal_parameter_rest(self, parameter);
        } else {
            self.visit_binding_rest_element(&parameter.rest);
        }
    }
}

#[napi]
pub fn extract_specifiers(
    file_path: Utf16String,
    source_utf16: Utf16String,
    raw_comments: Option<bool>,
    wasi_parser: Option<bool>,
) -> Vec<Utf16String> {
    let wasi_parser = wasi_parser.unwrap_or(false);
    let source_text = parser_text(&source_utf16, wasi_parser);
    let allocator = Allocator::default();
    let result = parse_source(&allocator, &file_path, &source_text, wasi_parser);
    let module = &result.module_record;
    let mut imports = Vec::new();
    for (name, requests) in &module.requested_modules {
        for request in requests {
            if request.is_import {
                imports.push((request.statement_span.start, name));
            }
        }
    }
    imports.sort_unstable_by_key(|(start, _)| *start);
    let mut specifiers = Vec::with_capacity(imports.len());
    for (_, name) in imports {
        specifiers.push(name.to_string().into());
    }

    let mut exports = Vec::new();
    for entry in module
        .local_export_entries
        .iter()
        .chain(&module.indirect_export_entries)
        .chain(&module.star_export_entries)
    {
        if let Some(request) = &entry.module_request {
            exports.push((entry.statement_span.start, &request.name));
        }
    }
    exports.sort_by_key(|(start, _)| *start);
    for (_, name) in exports {
        specifiers.push(name.to_string().into());
    }

    let mut positions = None;
    for import in &module.dynamic_imports {
        let span = import.module_request;
        let positions = positions.get_or_insert_with(|| SourcePositions::new(&source_text));
        let raw = &source_utf16[(positions.utf16_offset(span.start) as usize)
            .min(source_utf16.len())
            ..(positions.utf16_offset(span.end) as usize).min(source_utf16.len())];
        let cleaned = if raw.len() >= 2
            && matches!(raw[0], 0x27 | 0x22 | 0x60)
            && raw[0] == raw[raw.len() - 1]
        {
            &raw[1..raw.len() - 1]
        } else {
            raw
        };
        if !cleaned.is_empty() && !cleaned.contains(&0x24) && !cleaned.contains(&0x2b) {
            specifiers.push(cleaned.to_owned().into());
        }
    }

    if !crate::analyzer::common::encode_utf16(&file_path).contains("node_modules") {
        RequireVisitor {
            specifiers: &mut specifiers,
            is_typescript: result.program.source_type.is_typescript(),
        }
        .visit_program(&result.program);
    }
    for comment in &result.program.comments {
        if comment.is_block() {
            let span = comment.content_span();
            let value = &source_text[span.start as usize..span.end as usize];
            for captures in COMMENT_IMPORT.captures_iter(value) {
                let capture = captures.get(1).unwrap();
                if raw_comments.unwrap_or(false) {
                    let positions =
                        positions.get_or_insert_with(|| SourcePositions::new(&source_text));
                    let start = positions.utf16_offset(span.start + capture.start() as u32);
                    let end = positions.utf16_offset(span.start + capture.end() as u32);
                    specifiers.push(source_utf16[start as usize..end as usize].to_vec().into());
                } else {
                    specifiers.push(capture.as_str().to_owned().into());
                }
            }
        }
    }
    specifiers
}
