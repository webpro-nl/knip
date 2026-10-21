use oxc_ast::{AstKind, ast::*};
use oxc_span::{GetSpan, Span};

use super::common::{argument_string, encode_literal, encode_utf16, property_name, string_value};
use super::state::{
    ExportMember, IssueSymbol, LocalImport, RE_EXPORT, State, Tags, add_ns_value, add_value,
};

#[path = "export_refs.rs"]
mod export_refs;
pub use export_refs::{RefState, finish};
use export_refs::{collect, collect_expression, collect_type, mark_namespace_refs};

pub fn enter<'a>(kind: AstKind<'a>, s: &mut State<'a, '_>) {
    if let AstKind::ExpressionStatement(node) = kind {
        expression_statement(node, s);
        return;
    }
    if s.skip_exports || s.is_in_namespace(kind.span()) {
        return;
    }
    match kind {
        AstKind::ExportDeclaration(node) => declaration(&node.declaration, node.span.start, s),
        AstKind::ExportNamedDeclaration(node) => specifiers(
            &node.specifiers,
            node.span.start,
            node.export_kind,
            false,
            s,
        ),
        AstKind::ExportFromDeclaration(node) => {
            specifiers(&node.specifiers, node.span.start, node.export_kind, true, s)
        }
        AstKind::ExportDefaultDeclaration(node) => default_export(node, s),
        AstKind::TSExportAssignment(node) => export_assignment(node, s),
        _ => {}
    }
}

fn export_name<'a>(name: &'a ModuleExportName<'_>) -> Option<&'a str> {
    match name {
        ModuleExportName::IdentifierName(id) => Some(&id.name),
        ModuleExportName::IdentifierReference(id) => Some(&id.name),
        _ => None,
    }
}

fn local_to_export(s: &mut State<'_, '_>, local: &str, exported: &str) {
    s.local_to_exports
        .entry(local.to_owned())
        .or_default()
        .insert(exported.to_owned());
}

fn bind_import(s: &mut State<'_, '_>, import: &LocalImport, exported: &str) {
    if let Some(internal) = s.internal.get_mut(&import.file_path) {
        if import.is_namespace {
            add_value(&mut internal.re_export_ns, exported, s.file_path);
        } else if import.imported_name != exported {
            add_ns_value(
                &mut internal.re_export_as,
                &import.imported_name,
                exported,
                s.file_path,
            );
        } else {
            add_value(&mut internal.re_export, &import.imported_name, s.file_path);
        }
    }
}

fn specifiers<'a>(
    specs: &'a [ExportSpecifier<'a>],
    start: u32,
    kind: ImportOrExportKind,
    from: bool,
    s: &mut State<'a, '_>,
) {
    let decl_tags = s.get_tags(start);
    for spec in specs {
        let Some(exported) = export_name(&spec.exported).or_else(|| export_name(&spec.local))
        else {
            continue;
        };
        let local = export_name(&spec.local);
        let is_type =
            kind == ImportOrExportKind::Type || spec.export_kind == ImportOrExportKind::Type;
        let fix = if if is_type {
            s.options.is_fix_types
        } else {
            s.options.is_fix_exports
        } {
            Some([s.pos(spec.span.start), s.pos(spec.span.end), 3])
        } else {
            None
        };
        let mut tags = decl_tags.clone();
        let (is_re_export, binding_re_export) = if from {
            tags = tags.union(s.get_tags(spec.span.start));
            (true, true)
        } else if let Some(import) = local.and_then(|name| s.local_import_map.get(name)).cloned() {
            bind_import(s, &import, exported);
            (true, !import.is_dynamic_import)
        } else {
            (false, false)
        };
        s.add_export(
            exported,
            if is_type { "type" } else { "unknown" },
            spec.exported.span().start,
            vec![],
            fix,
            is_re_export,
            tags,
            if from { Some(exported) } else { local },
            binding_re_export,
        );
        if !from {
            s.specifier_export_names.insert(exported.to_owned());
            if let Some(local) = local {
                local_to_export(s, local, exported);
            }
        }
    }
}

fn explicit_return(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::ArrowFunctionExpression(f) => f.return_type.is_some(),
        Expression::FunctionExpression(f) => f.return_type.is_some(),
        _ => false,
    }
}

fn alias(s: &mut State<'_, '_>, local: &str, exported: &str, byte_pos: u32) {
    let Some(existing) = s.exports.get(local) else {
        return;
    };
    let initial = IssueSymbol {
        symbol: local.to_owned(),
        pos: existing.pos,
        line: existing.line,
        col: existing.col,
    };
    let p = s.positions.position(byte_pos);
    s.aliased_exports
        .entry(local.to_owned())
        .or_insert_with(|| vec![initial])
        .push(IssueSymbol {
            symbol: exported.to_owned(),
            pos: p.pos,
            line: p.line,
            col: p.col,
        });
}

fn destructured<'a>(
    id: &'a BindingIdentifier<'a>,
    span: Span,
    flags: u32,
    init: Option<&'a Expression<'a>>,
    start: u32,
    s: &mut State<'a, '_>,
) {
    let fix = s.get_fix(span.start, span.end, flags);
    s.add_export(
        &id.name,
        "unknown",
        id.span.start,
        vec![],
        fix,
        false,
        s.get_tags(start),
        None,
        false,
    );
    if let Some(init) = init {
        collect_expression(init, &id.name, false, s);
    }
    s.destructured_exports.insert(id.name.to_string());
}

fn find_spreads(obj: &ObjectExpression<'_>, name: &str, path: &str, s: &mut State<'_, '_>) -> bool {
    let mut found = false;
    for prop in &obj.properties {
        match prop {
            ObjectPropertyKind::SpreadProperty(prop) => {
                if let Expression::Identifier(id) = &prop.argument {
                    if let Some(import) = s.local_import_map.get(id.name.as_str()) {
                        if let Some(internal) = s.internal.get_mut(&import.file_path) {
                            add_ns_value(&mut internal.re_export_as, &id.name, path, s.file_path);
                        }
                        s.accessed_aliases.insert(name.to_owned());
                        found = true;
                    }
                }
            }
            ObjectPropertyKind::ObjectProperty(prop) => {
                if let Expression::ObjectExpression(obj) = &prop.value {
                    let key = match &prop.key {
                        PropertyKey::Identifier(id) => Some(id.name.to_string()),
                        key => property_name(key),
                    };
                    if let Some(key) = key.filter(|key| !key.is_empty()) {
                        found |= find_spreads(obj, name, &format!("{path}.{key}"), s);
                    }
                }
            }
        }
    }
    found
}

fn declaration<'a>(decl: &'a Declaration<'a>, start: u32, s: &mut State<'a, '_>) {
    match decl {
        Declaration::VariableDeclaration(decl) => {
            for d in &decl.declarations {
                match &d.id {
                    BindingPattern::ObjectPattern(pattern) => {
                        for prop in &pattern.properties {
                            let id = match &prop.value {
                                BindingPattern::BindingIdentifier(id) => Some(id.as_ref()),
                                BindingPattern::AssignmentPattern(value) => match &value.left {
                                    BindingPattern::BindingIdentifier(id) => Some(id.as_ref()),
                                    _ => None,
                                },
                                _ => None,
                            };
                            if let Some(id) = id {
                                destructured(id, prop.span, 1, d.init.as_ref(), start, s);
                            }
                        }
                        if let Some(rest) = &pattern.rest {
                            if let BindingPattern::BindingIdentifier(id) = &rest.argument {
                                destructured(id, rest.span, 1, d.init.as_ref(), start, s);
                            }
                        }
                    }
                    BindingPattern::ArrayPattern(pattern) => {
                        for element in pattern.elements.iter().flatten() {
                            if let BindingPattern::BindingIdentifier(id) = element {
                                destructured(id, id.span, 0, d.init.as_ref(), start, s);
                            }
                        }
                        if let Some(rest) = &pattern.rest {
                            if let BindingPattern::BindingIdentifier(id) = &rest.argument {
                                destructured(id, rest.span, 0, d.init.as_ref(), start, s);
                            }
                        }
                    }
                    BindingPattern::BindingIdentifier(id) => {
                        let tags = s.get_tags(start);
                        let mut is_re_export = false;
                        if let Some(Expression::Identifier(init)) = &d.init {
                            if let Some(import) =
                                s.local_import_map.get(init.name.as_str()).cloned()
                            {
                                bind_import(s, &import, &id.name);
                                is_re_export = true;
                            }
                        }
                        if let Some(Expression::ObjectExpression(obj)) = &d.init {
                            is_re_export |= find_spreads(obj, &id.name, &id.name, s);
                        }
                        s.add_export(
                            &id.name,
                            "unknown",
                            id.span.start,
                            vec![],
                            s.get_fix(start, start + 7, 0),
                            is_re_export,
                            tags.clone(),
                            None,
                            false,
                        );
                        if let Some(annotation) = &d.type_annotation {
                            collect_type(&annotation.type_annotation, &id.name, true, s);
                        } else if let Some(init) = &d.init {
                            collect_expression(init, &id.name, explicit_return(init), s);
                        }
                        if !tags.contains("@alias") {
                            if let Some(Expression::Identifier(init)) = &d.init {
                                if s.exports
                                    .get(init.name.as_str())
                                    .is_some_and(|e| !e.is_re_export)
                                {
                                    alias(s, &init.name, &id.name, id.span.start);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Declaration::FunctionDeclaration(f) => {
            if let Some(id) = &f.id {
                s.add_export(
                    &id.name,
                    "function",
                    id.span.start,
                    vec![],
                    s.get_fix(start, start + 7, 0),
                    false,
                    s.get_tags(start),
                    None,
                    false,
                );
                collect(
                    AstKind::Function(f),
                    &id.name,
                    f.r#type != FunctionType::TSDeclareFunction && f.return_type.is_some(),
                    s,
                );
            }
        }
        Declaration::ClassDeclaration(class) => {
            if let Some(id) = &class.id {
                s.add_export(
                    &id.name,
                    "class",
                    id.span.start,
                    vec![],
                    s.get_fix(start, start + 7, 0),
                    false,
                    s.get_tags(start),
                    None,
                    false,
                );
                collect(AstKind::Class(class), &id.name, true, s);
            }
        }
        Declaration::TSTypeAliasDeclaration(decl) => {
            s.add_export(
                &decl.id.name,
                "type",
                decl.id.span.start,
                vec![],
                s.get_type_fix(start, start + 7),
                false,
                s.get_tags(start),
                None,
                false,
            );
            collect_type(&decl.type_annotation, &decl.id.name, false, s);
        }
        Declaration::TSInterfaceDeclaration(decl) => {
            s.add_export(
                &decl.id.name,
                "interface",
                decl.id.span.start,
                vec![],
                s.get_type_fix(start, start + 7),
                false,
                s.get_tags(start),
                None,
                false,
            );
            collect(
                AstKind::TSInterfaceBody(&decl.body),
                &decl.id.name,
                false,
                s,
            );
            for heritage in &decl.extends {
                if let TSTypeName::IdentifierReference(id) = &heritage.type_name {
                    s.add_ref_in_export(&id.name, &decl.id.name);
                }
            }
        }
        Declaration::TSEnumDeclaration(decl) => {
            let members = enum_members(decl, s);
            s.add_export(
                &decl.id.name,
                "enum",
                decl.id.span.start,
                members,
                s.get_type_fix(start, start + 7),
                false,
                s.get_tags(start),
                None,
                false,
            );
        }
        Declaration::TSNamespaceDeclaration(decl)
            if matches!(&decl.body, TSNamespaceDeclarationBody::TSModuleBlock(_)) =>
        {
            let members = namespace_members(decl, "", s);
            s.add_export(
                &decl.id.name,
                "namespace",
                decl.id.span.start,
                members,
                s.get_fix(start, start + 7, 0),
                false,
                s.get_tags(start),
                None,
                false,
            );
        }
        _ => {}
    }
}

fn default_export<'a>(node: &'a ExportDefaultDeclaration<'a>, s: &mut State<'a, '_>) {
    let decl = &node.declaration;
    let has_body = matches!(decl, ExportDefaultDeclarationKind::ClassDeclaration(_))
        || matches!(decl, ExportDefaultDeclarationKind::FunctionDeclaration(f) if f.r#type != FunctionType::TSDeclareFunction);
    let fix = if s.options.is_fix_exports {
        Some([
            s.pos(node.span.start),
            if has_body {
                s.pos(decl.span().start)
            } else {
                s.pos(node.span.end) + 1
            },
            0,
        ])
    } else {
        None
    };
    let mut kind = "unknown".to_owned();
    let mut pos = decl.span().start;
    let mut binding = "default";
    match decl {
        ExportDefaultDeclarationKind::FunctionDeclaration(f) => {
            kind = "function".to_owned();
            if let Some(id) = &f.id {
                pos = id.span.start;
                binding = &id.name;
            }
            collect(
                AstKind::Function(f),
                "default",
                f.r#type != FunctionType::TSDeclareFunction && f.return_type.is_some(),
                s,
            );
        }
        ExportDefaultDeclarationKind::ClassDeclaration(class) => {
            kind = "class".to_owned();
            if let Some(id) = &class.id {
                pos = id.span.start;
                binding = &id.name;
                local_to_export(s, &id.name, "default");
            }
            collect(AstKind::Class(class), "default", true, s);
        }
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(interface) => {
            kind = "interface".to_owned();
            pos = interface.id.span.start;
            binding = &interface.id.name;
            collect(
                AstKind::TSInterfaceBody(&interface.body),
                "default",
                false,
                s,
            );
        }
        ExportDefaultDeclarationKind::Identifier(id) => {
            kind = s
                .local_declaration_types
                .get(id.name.as_str())
                .cloned()
                .unwrap_or(kind);
            local_to_export(s, &id.name, "default");
            if let Some(import) = s.local_import_map.get(id.name.as_str()) {
                if let Some(internal) = s.internal.get_mut(&import.file_path) {
                    if import.imported_name != "default" {
                        add_ns_value(
                            &mut internal.re_export_as,
                            &import.imported_name,
                            "default",
                            s.file_path,
                        );
                    } else {
                        add_value(&mut internal.re_export, "default", s.file_path);
                    }
                }
            }
            if !s.get_tags(node.span.start).contains("@alias")
                && !s.specifier_export_names.contains(id.name.as_str())
            {
                alias(s, &id.name, "default", id.span.start);
            }
        }
        _ => {}
    }
    s.add_export(
        "default",
        &kind,
        pos,
        vec![],
        fix,
        false,
        s.get_tags(node.span.start),
        Some(binding),
        false,
    );
}

fn export_assignment(node: &TSExportAssignment<'_>, s: &mut State<'_, '_>) {
    let mut is_re_export = false;
    if let Expression::Identifier(id) = &node.expression {
        if let Some(import) = s.local_import_map.get(id.name.as_str()) {
            is_re_export = true;
            if let Some(internal) = s.internal.get_mut(&import.file_path) {
                add_ns_value(&mut internal.re_export_as, &id.name, "default", s.file_path);
                internal.refs.insert(id.name.to_string());
            }
        }
    }
    s.add_export(
        "default",
        "unknown",
        node.expression.span().start,
        vec![],
        None,
        is_re_export,
        s.get_tags(node.span.start),
        None,
        false,
    );
}

fn module_exports(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::StaticMemberExpression(member) => {
            matches!(&member.object, Expression::Identifier(id) if id.name == "module")
                && member.property.name == "exports"
        }
        Expression::PrivateFieldExpression(member) => {
            matches!(&member.object, Expression::Identifier(id) if id.name == "module")
                && member.field.name == "exports"
        }
        _ => false,
    }
}

fn require_call<'a>(expr: &'a Expression<'a>) -> Option<&'a CallExpression<'a>> {
    match expr {
        Expression::CallExpression(call) if matches!(&call.callee, Expression::Identifier(id) if id.name == "require") => {
            Some(call)
        }
        _ => None,
    }
}

fn expression_statement(node: &ExpressionStatement<'_>, s: &mut State<'_, '_>) {
    if let Expression::Identifier(id) = &node.expression {
        if s.destructured_exports.contains(id.name.as_str()) {
            s.bare_expr_refs.insert(id.name.to_string());
        }
    }
    if !s.is_js {
        return;
    }
    let Expression::AssignmentExpression(expr) = &node.expression else {
        return;
    };
    if expr.operator != oxc_syntax::operator::AssignmentOperator::Assign {
        return;
    }
    let (object, name, pos, computed) = match &expr.left {
        AssignmentTarget::StaticMemberExpression(member) => (
            &member.object,
            Some(member.property.name.to_string()),
            member.property.span.start,
            false,
        ),
        AssignmentTarget::PrivateFieldExpression(member) if matches!(&member.object, Expression::Identifier(id) if id.name == "exports" || id.name == "module") => {
            (
                &member.object,
                Some(member.field.name.to_string()),
                member.field.span.start,
                false,
            )
        }
        AssignmentTarget::ComputedMemberExpression(member) => (
            &member.object,
            string_value(&member.expression),
            member.expression.span().start,
            true,
        ),
        _ => return,
    };
    if !computed && matches!(object, Expression::Identifier(id) if id.name == "exports") {
        if !s.skip_exports {
            if let Some(name) = name.filter(|v| !v.is_empty()) {
                s.add_export(
                    &name,
                    "unknown",
                    pos,
                    vec![],
                    s.get_fix(node.span.start, node.span.end, 0),
                    false,
                    Tags::default(),
                    None,
                    false,
                );
            }
        }
        return;
    }
    if module_exports(object) {
        if let Some(name) = name.filter(|v| !v.is_empty()) {
            let right = match &expr.right {
                Expression::StaticMemberExpression(member) => {
                    Some((&member.object, Some(member.property.name.to_string())))
                }
                Expression::ComputedMemberExpression(member) => {
                    Some((&member.object, string_value(&member.expression)))
                }
                _ => None,
            };
            let mut is_re_export = false;
            if let Some((object, Some(member))) = right {
                if let Some(call) = require_call(object).filter(|call| call.arguments.len() == 1) {
                    if let Some(specifier) = argument_string(&call.arguments[0]) {
                        if !member.is_empty() {
                            s.add_import(
                                &specifier,
                                Some(&member),
                                (name != member).then_some(name.as_str()),
                                None,
                                call.arguments[0].span().start,
                                RE_EXPORT,
                                None,
                                None,
                                None,
                            );
                            is_re_export = true;
                        }
                    }
                }
            }
            if !s.skip_exports {
                s.add_export(
                    &name,
                    "unknown",
                    pos,
                    vec![],
                    s.get_fix(node.span.start, node.span.end, 0),
                    is_re_export,
                    Tags::default(),
                    None,
                    false,
                );
            }
        }
        return;
    }
    if computed
        || !matches!(object, Expression::Identifier(id) if id.name == "module")
        || name.as_deref() != Some("exports")
    {
        return;
    }
    if let Expression::ObjectExpression(obj) = &expr.right {
        if s.skip_exports {
            return;
        }
        let shorthand = !obj.properties.is_empty()
            && obj
                .properties
                .iter()
                .all(|prop| matches!(prop, ObjectPropertyKind::ObjectProperty(p) if p.shorthand));
        if shorthand {
            for prop in &obj.properties {
                if let ObjectPropertyKind::ObjectProperty(prop) = prop {
                    if let PropertyKey::StaticIdentifier(id) = &prop.key {
                        s.add_export(
                            &id.name,
                            "unknown",
                            id.span.start,
                            vec![],
                            s.get_fix(prop.span.start, prop.span.end, 0),
                            false,
                            Tags::default(),
                            None,
                            false,
                        );
                    }
                }
            }
        } else {
            s.add_export(
                "default",
                "unknown",
                obj.span.start,
                vec![],
                None,
                false,
                Tags::default(),
                None,
                false,
            );
        }
        for prop in &obj.properties {
            if let ObjectPropertyKind::SpreadProperty(prop) = prop {
                if let Some(call) = require_call(&prop.argument) {
                    if let Some(arg) = call.arguments.first() {
                        if let Some(specifier) = argument_string(arg) {
                            s.add_import(
                                &specifier,
                                Some("*"),
                                None,
                                None,
                                arg.span().start,
                                RE_EXPORT,
                                None,
                                None,
                                None,
                            );
                        }
                    }
                }
            }
        }
    } else if let Some(call) = require_call(&expr.right) {
        if let Some(arg) = call.arguments.first() {
            if let Some(specifier) = argument_string(arg) {
                s.add_import(
                    &specifier,
                    Some("*"),
                    None,
                    None,
                    arg.span().start,
                    RE_EXPORT,
                    None,
                    None,
                    None,
                );
            }
        }
    } else if !s.skip_exports {
        s.add_export(
            "default",
            "unknown",
            expr.right.span().start,
            vec![],
            None,
            false,
            Tags::default(),
            None,
            false,
        );
    }
}

fn make_member(name: String, byte_pos: u32, span: Span, s: &State<'_, '_>) -> ExportMember {
    let p = s.positions.position(byte_pos);
    ExportMember {
        has_refs_in_file: name.is_empty(),
        identifier: name,
        r#type: "member".to_owned(),
        pos: p.pos,
        line: p.line,
        col: p.col,
        fix: s.get_fix(span.start, span.end, 5),
        js_doc_tags: s.get_tags(span.start),
        flags: 0,
    }
}

fn enum_members(decl: &TSEnumDeclaration<'_>, s: &State<'_, '_>) -> Vec<ExportMember> {
    let mut members = Vec::with_capacity(decl.body.members.len());
    for member in &decl.body.members {
        let name = match &member.id {
            TSEnumMemberName::Identifier(id) => id.name.to_string(),
            TSEnumMemberName::String(literal) | TSEnumMemberName::ComputedString(literal) => {
                if let Some(raw) = &literal.raw {
                    let raw = raw.as_str();
                    let quoted = raw.len() >= 2
                        && raw.as_bytes()[0] == raw.as_bytes()[raw.len() - 1]
                        && matches!(raw.as_bytes()[0], b'\'' | b'"' | b'`');
                    if let Some(source) = s.raw_source {
                        let start = s.pos(literal.span.start) as usize + usize::from(quoted);
                        let end = s.pos(literal.span.end) as usize - usize::from(quoted);
                        encode_utf16(&source[start..end])
                    } else {
                        let stripped = if quoted { &raw[1..raw.len() - 1] } else { raw };
                        encode_literal(stripped, false)
                    }
                } else {
                    encode_literal(&literal.value, literal.lone_surrogates)
                }
            }
            _ => String::new(),
        };
        members.push(make_member(name, member.id.span().start, member.span, s));
    }
    members
}

fn namespace_members<'a>(
    decl: &'a TSNamespaceDeclaration<'a>,
    prefix: &str,
    s: &State<'a, '_>,
) -> Vec<ExportMember> {
    let TSNamespaceDeclarationBody::TSModuleBlock(body) = &decl.body else {
        return vec![];
    };
    let mut members: Vec<ExportMember> = Vec::new();
    for stmt in &body.body {
        let Statement::ExportDeclaration(stmt) = stmt else {
            continue;
        };
        if let Declaration::TSNamespaceDeclaration(nested) = &stmt.declaration {
            let prefix = if prefix.is_empty() {
                nested.id.name.to_string()
            } else {
                format!("{prefix}.{}", nested.id.name)
            };
            members.extend(namespace_members(nested, &prefix, s));
            continue;
        }
        let mut add = |id: &BindingIdentifier<'_>| {
            let name = if prefix.is_empty() {
                id.name.to_string()
            } else {
                format!("{prefix}.{}", id.name)
            };
            if let Some(member) = members.iter_mut().find(|member| member.identifier == name) {
                member.js_doc_tags.merge(s.get_tags(stmt.span.start));
            } else {
                members.push(make_member(name, id.span.start, stmt.span, s));
            }
        };
        match &stmt.declaration {
            Declaration::VariableDeclaration(decl) => {
                for d in &decl.declarations {
                    if let BindingPattern::BindingIdentifier(id) = &d.id {
                        add(id);
                    }
                }
            }
            Declaration::FunctionDeclaration(decl) => {
                if let Some(id) = &decl.id {
                    add(id);
                }
            }
            Declaration::ClassDeclaration(decl) => {
                if let Some(id) = &decl.id {
                    add(id);
                }
            }
            Declaration::TSTypeAliasDeclaration(decl) => add(&decl.id),
            Declaration::TSInterfaceDeclaration(decl) => add(&decl.id),
            Declaration::TSEnumDeclaration(decl) => add(&decl.id),
            Declaration::TSImportEqualsDeclaration(decl) => add(&decl.id),
            _ => {}
        }
    }
    if prefix.is_empty() && !members.is_empty() {
        mark_namespace_refs(&body.body, &mut members);
    }
    members
}
