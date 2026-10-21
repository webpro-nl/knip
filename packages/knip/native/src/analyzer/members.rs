use super::{common::string_value, state::*};
use oxc_ast::{AstKind, ast::*};
use oxc_span::Span;
use oxc_syntax::number::ToJsString;

#[derive(Clone, Copy)]
struct Member<'a> {
    object: &'a Expression<'a>,
    property: Option<&'a str>,
    computed: Option<&'a Expression<'a>>,
    span: Span,
}
impl<'a> Member<'a> {
    fn expression(expression: &'a Expression<'a>) -> Option<Self> {
        match expression {
            Expression::StaticMemberExpression(m) => Some(Self {
                object: &m.object,
                property: Some(&m.property.name),
                computed: None,
                span: m.span,
            }),
            Expression::ComputedMemberExpression(m) => Some(Self {
                object: &m.object,
                property: None,
                computed: Some(&m.expression),
                span: m.span,
            }),
            Expression::PrivateFieldExpression(m) => Some(Self {
                object: &m.object,
                property: None,
                computed: None,
                span: m.span,
            }),
            _ => None,
        }
    }
    fn value(&self) -> Option<String> {
        self.property
            .map(str::to_owned)
            .or_else(|| self.computed.and_then(string_value))
    }
}
fn numeric_key(value: &str) -> bool {
    if value == "-0" || value.is_empty() {
        return false;
    }
    value
        .parse::<f64>()
        .is_ok_and(|number| number.is_finite() && number.to_js_string() == value)
}
fn whole_read(map: &mut ImportMaps, id: &str) {
    map.enumerated
        .get_or_insert_with(Strings::new)
        .insert(id.to_owned());
}

pub fn enter<'a>(kind: AstKind<'a>, s: &mut State<'a, '_>) {
    let member = match kind {
        AstKind::StaticMemberExpression(m) => Member {
            object: &m.object,
            property: Some(&m.property.name),
            computed: None,
            span: m.span,
        },
        AstKind::ComputedMemberExpression(m) => Member {
            object: &m.object,
            property: None,
            computed: Some(&m.expression),
            span: m.span,
        },
        AstKind::PrivateFieldExpression(m) => Member {
            object: &m.object,
            property: None,
            computed: None,
            span: m.span,
        },
        AstKind::JSXMemberExpression(m) => {
            if let JSXMemberExpressionObject::IdentifierReference(id) = &m.object {
                if let Some(import) = s.local_import_map.get(id.name.as_str()) {
                    if let Some(map) = s.internal.get_mut(&import.file_path) {
                        add_ns_member_ref(map, &id.name, &m.property.name);
                    }
                }
            }
            return;
        }
        _ => return,
    };
    let inner = Member::expression(member.object);
    if let Some(inner) = inner.filter(|inner| Member::expression(inner.object).is_some()) {
        s.chained_member_exprs
            .insert((inner.span.start, inner.span.end));
    }
    if let Expression::Identifier(object) = member.object {
        let name = object.name.as_str();
        let shadowed = s.is_shadowed(name, object.span.start);
        let import = if shadowed {
            None
        } else {
            s.local_import_map.get(name)
        };
        if let Some(import) = import {
            if let Some(map) = s.internal.get_mut(&import.file_path) {
                let value = member.value();
                if member.computed.is_some() {
                    if value.as_deref().is_some_and(numeric_key) && !import.is_namespace {
                        whole_read(map, &import.imported_name);
                        return;
                    }
                    if value.is_none() {
                        if import.is_namespace {
                            add_value(&mut map.import, "__opaque", s.file_path);
                        } else {
                            whole_read(map, &import.imported_name);
                        }
                        return;
                    }
                }
                if let Some(value) = value.filter(|v| !v.is_empty()) {
                    if import.is_dynamic_import {
                        add_value(&mut map.import, &value, s.file_path);
                    } else {
                        add_ns_member_ref(map, name, &value);
                    }
                }
            }
        } else if !shadowed {
            if let Some(property) = member.property.filter(|p| !p.is_empty()) {
                s.member_refs_in_file
                    .push((name.to_owned(), property.to_owned()));
            }
        }
        if let Some(aliases) = s.import_aliases.get(name) {
            s.accessed_aliases.insert(name.to_owned());
            let value = member.value();
            let whole = member.computed.is_some() && value.as_deref().is_none_or(numeric_key);
            for alias in aliases {
                if let Some(map) = s.internal.get_mut(&alias.file_path) {
                    if whole {
                        let id = s
                            .local_import_map
                            .get(&alias.id)
                            .map_or(alias.id.as_str(), |origin| origin.imported_name.as_str());
                        whole_read(map, id);
                    } else if let Some(value) = value.as_deref().filter(|v| !v.is_empty()) {
                        add_ns_member_ref(map, &alias.id, value);
                    }
                }
            }
        }
    }
    if let Some(inner) = inner.filter(|i| i.property.is_some()) {
        if let Expression::Identifier(root) = inner.object {
            let name = root.name.as_str();
            let mid = inner.property.unwrap();
            if !s.is_shadowed(name, root.span.start) {
                if member.computed.is_some() {
                    if let Some(import) = s.local_import_map.get(name).filter(|i| i.is_namespace) {
                        if let Some(map) = s.internal.get_mut(&import.file_path) {
                            if let Some(value) = member.value().filter(|v| !numeric_key(v)) {
                                add_ns_member_ref(map, name, &format!("{mid}.{value}"));
                            } else {
                                whole_read(map, mid);
                            }
                        }
                    }
                }
                if let Some(property) = member.property {
                    if let Some(import) = s.local_import_map.get(name) {
                        if let Some(map) = s.internal.get_mut(&import.file_path) {
                            add_ns_member_ref(map, name, mid);
                            if !s
                                .chained_member_exprs
                                .contains(&(member.span.start, member.span.end))
                            {
                                add_ns_member_ref(map, name, &format!("{mid}.{property}"));
                            }
                        }
                        if !import.is_namespace {
                            if let Some(mid_import) = s.local_import_map.get(mid) {
                                if let Some(map) = s.internal.get_mut(&mid_import.file_path) {
                                    add_ns_member_ref(map, mid, property);
                                }
                            }
                        }
                    } else {
                        s.member_refs_in_file
                            .push((name.to_owned(), mid.to_owned()));
                        s.member_refs_in_file
                            .push((name.to_owned(), format!("{mid}.{property}")));
                    }
                }
            }
            if let Some(ns) = s.ns_containers.get(name).and_then(|map| map.get(mid)) {
                if let Some(import) = s.local_import_map.get(ns) {
                    if let Some(map) = s.internal.get_mut(&import.file_path) {
                        if let Some(value) = member.value().filter(|v| !v.is_empty()) {
                            add_ns_member_ref(map, ns, &value);
                            s.accessed_ns_containers.insert(format!("{name}.{mid}"));
                        }
                    }
                }
            }
        }
        if let Some(property) = member.property {
            if let Some(inner2) = Member::expression(inner.object).filter(|i| i.property.is_some())
            {
                if let Expression::Identifier(root) = inner2.object {
                    let name = root.name.as_str();
                    if !s.is_shadowed(name, root.span.start) {
                        let a = inner2.property.unwrap();
                        let b = inner.property.unwrap();
                        let paths = [
                            a.to_owned(),
                            format!("{a}.{b}"),
                            format!("{a}.{b}.{property}"),
                        ];
                        if let Some(import) = s.local_import_map.get(name) {
                            if let Some(map) = s.internal.get_mut(&import.file_path) {
                                for path in paths {
                                    add_ns_member_ref(map, name, &path);
                                }
                            }
                        } else {
                            for path in paths {
                                s.member_refs_in_file.push((name.to_owned(), path));
                            }
                        }
                    }
                }
            }
        }
    }
}

pub fn qualified_enter(node: &TSQualifiedName<'_>, s: &mut State<'_, '_>) {
    if let TSTypeName::QualifiedName(inner) = &node.left {
        if matches!(inner.left, TSTypeName::QualifiedName(_)) {
            s.chained_member_exprs
                .insert((inner.span.start, inner.span.end));
        }
    }
    let mut parts = vec![node.right.name.as_str()];
    let mut left = &node.left;
    while let TSTypeName::QualifiedName(inner) = left {
        parts.push(inner.right.name.as_str());
        left = &inner.left;
    }
    let TSTypeName::IdentifierReference(root) = left else {
        return;
    };
    parts.reverse();
    let name = root.name.as_str();
    let shadowed = s.is_shadowed(name, root.span.start);
    if parts.len() == 1 {
        if let Some(import) = s.local_import_map.get(name).filter(|_| !shadowed) {
            if let Some(map) = s.internal.get_mut(&import.file_path) {
                if import.is_dynamic_import {
                    add_value(&mut map.import, parts[0], s.file_path);
                } else {
                    add_ns_member_ref(map, name, parts[0]);
                }
            }
        } else if !shadowed {
            s.member_refs_in_file
                .push((name.to_owned(), parts[0].to_owned()));
        }
        if let Some(aliases) = s.import_aliases.get(name) {
            s.accessed_aliases.insert(name.to_owned());
            for alias in aliases {
                if let Some(map) = s.internal.get_mut(&alias.file_path) {
                    add_ns_member_ref(map, &alias.id, parts[0]);
                }
            }
        }
    }
    if parts.len() == 2 {
        if !shadowed {
            if let Some(import) = s.local_import_map.get(name) {
                if let Some(map) = s.internal.get_mut(&import.file_path) {
                    add_ns_member_ref(map, name, parts[0]);
                    if !s
                        .chained_member_exprs
                        .contains(&(node.span.start, node.span.end))
                    {
                        add_ns_member_ref(map, name, &parts.join("."));
                    }
                }
                if !import.is_namespace {
                    if let Some(mid) = s.local_import_map.get(parts[0]) {
                        if let Some(map) = s.internal.get_mut(&mid.file_path) {
                            add_ns_member_ref(map, parts[0], parts[1]);
                        }
                    }
                }
            } else {
                s.member_refs_in_file
                    .push((name.to_owned(), parts[0].to_owned()));
                s.member_refs_in_file
                    .push((name.to_owned(), parts.join(".")));
            }
        }
        if let Some(namespace) = s.ns_containers.get(name).and_then(|map| map.get(parts[0])) {
            if let Some(import) = s.local_import_map.get(namespace) {
                if let Some(map) = s.internal.get_mut(&import.file_path) {
                    add_ns_member_ref(map, namespace, parts[1]);
                    s.accessed_ns_containers
                        .insert(format!("{name}.{}", parts[0]));
                }
            }
        }
    }
    if parts.len() == 3 && !shadowed {
        if let Some(import) = s.local_import_map.get(name) {
            if let Some(map) = s.internal.get_mut(&import.file_path) {
                for end in 1..=3 {
                    add_ns_member_ref(map, name, &parts[..end].join("."));
                }
            }
        } else {
            for end in 1..=3 {
                s.member_refs_in_file
                    .push((name.to_owned(), parts[..end].join(".")));
            }
        }
    }
}
