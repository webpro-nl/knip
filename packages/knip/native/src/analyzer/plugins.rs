use oxc_ast::{AstKind, ast::*};
use oxc_span::GetSpan;

use super::common::{
    argument_string, encode_literal, property_name, safe_script_from_args, script_from_arg,
    script_from_template, string_value,
};
use super::imports::named_member;
use super::state::{ENTRY, ImportGlob, OPAQUE, SIDE_EFFECTS, State, Strings};

pub struct Plugins {
    visitors: Vec<Plugin>,
}

enum Plugin {
    Bun,
    Jest(Jest),
    Mock(Mock),
    Vite,
    Webpack,
    Node(Bindings),
    Execa,
    NanoSpawn,
    Zx,
    Knex(Bindings),
    Pino(Pino),
    CustomElements(CustomElements),
    Styles(Styles),
}

impl Plugins {
    pub fn new(ids: &[String]) -> crate::error::Result<Self> {
        let mut visitors = Vec::with_capacity(ids.len());
        for id in ids {
            let plugin = match id.as_str() {
                "bun-shell" => Plugin::Bun,
                "jest" => Plugin::Jest(Jest::default()),
                "vitest" => Plugin::Mock(Mock {
                    rstest: false,
                    names: Strings::new(),
                }),
                "rstest" => Plugin::Mock(Mock {
                    rstest: true,
                    names: Strings::new(),
                }),
                "vite" => Plugin::Vite,
                "webpack" | "rspack" => Plugin::Webpack,
                "node" => Plugin::Node(Bindings::default()),
                "execa" => Plugin::Execa,
                "nano-spawn" => Plugin::NanoSpawn,
                "zx" => Plugin::Zx,
                "knex" => Plugin::Knex(Bindings::default()),
                "pino" => Plugin::Pino(Pino::default()),
                "lit" => Plugin::CustomElements(CustomElements::new(CustomKind::Lit)),
                "fast" => Plugin::CustomElements(CustomElements::new(CustomKind::Fast)),
                "catalyst" => Plugin::CustomElements(CustomElements::new(CustomKind::Catalyst)),
                "stencil-custom-elements" => {
                    Plugin::CustomElements(CustomElements::new(CustomKind::Stencil))
                }
                "stencil-style-urls" => Plugin::Styles(Styles {
                    angular: false,
                    names: Strings::new(),
                }),
                "angular-style-urls" => Plugin::Styles(Styles {
                    angular: true,
                    names: Strings::new(),
                }),
                _ => {
                    return Err(crate::error::AnalysisError::InvalidArgument(format!(
                        "Unsupported native visitor: {id}"
                    )));
                }
            };
            visitors.push(plugin);
        }
        Ok(Self { visitors })
    }

    pub fn enter<'a>(&mut self, kind: AstKind<'a>, s: &mut State<'a, '_>) {
        for plugin in &mut self.visitors {
            match plugin {
                Plugin::Bun => bun(kind, s),
                Plugin::Jest(visitor) => visitor.enter(kind, s),
                Plugin::Mock(visitor) => visitor.enter(kind, s),
                Plugin::Vite => vite(kind, s),
                Plugin::Webpack => webpack(kind, s),
                Plugin::Node(bindings) => node_glob(kind, bindings, s),
                Plugin::Execa => execa(kind, s),
                Plugin::NanoSpawn => nano_spawn(kind, s),
                Plugin::Zx if s.source_text.starts_with("#!/usr/bin/env zx") => bun(kind, s),
                Plugin::Zx => {}
                Plugin::Knex(bindings) => knex(kind, bindings, s),
                Plugin::Pino(visitor) => visitor.enter(kind, s),
                Plugin::CustomElements(visitor) => visitor.enter(kind, s),
                Plugin::Styles(visitor) => visitor.enter(kind, s),
            }
        }
    }

    pub fn leave<'a>(&mut self, kind: AstKind<'a>, s: &mut State<'a, '_>) {
        for plugin in &mut self.visitors {
            match plugin {
                Plugin::Jest(visitor) if matches!(kind, AstKind::Program(_)) => {
                    for lookup in &visitor.lookups {
                        let virtuals = if lookup.esm {
                            &visitor.virtual_esm
                        } else {
                            &visitor.virtual_cjs
                        };
                        if !virtuals.contains(&lookup.specifier) {
                            add_import(s, &lookup.specifier, lookup.pos, SIDE_EFFECTS);
                        }
                    }
                }
                Plugin::CustomElements(visitor)
                    if matches!(kind, AstKind::BlockStatement(_) | AstKind::FunctionBody(_)) =>
                {
                    visitor.depth -= 1
                }
                _ => {}
            }
        }
    }
}

fn add_import(s: &mut State<'_, '_>, specifier: &str, pos: u32, flags: u32) {
    s.add_import(specifier, None, None, None, pos, flags, None, None, None);
}

fn key_name(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::Identifier(id) => Some(id.name.to_string()),
        _ => property_name(key).or_else(|| key.as_expression().and_then(string_value)),
    }
}

fn find_property<'n, 'a>(
    object: &'n ObjectExpression<'a>,
    name: &str,
) -> Option<&'n Expression<'a>> {
    for prop in &object.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop {
            if key_name(&prop.key).as_deref() == Some(name) {
                return Some(&prop.value);
            }
        }
    }
    None
}

fn named_imports(program: &Program<'_>, source: &str, imported: &[&str], names: &mut Strings) {
    for statement in &program.body {
        let Statement::ImportDeclaration(import) = statement else {
            continue;
        };
        if import.source.value != source {
            continue;
        }
        if let Some(specifiers) = &import.specifiers {
            for specifier in specifiers {
                if let ImportDeclarationSpecifier::ImportSpecifier(specifier) = specifier {
                    if let ModuleExportName::IdentifierName(id) = &specifier.imported {
                        if imported.contains(&id.name.as_str()) {
                            names.insert(specifier.local.name.to_string());
                        }
                    }
                }
            }
        }
    }
}

#[derive(Default)]
struct Jest {
    names: Strings,
    virtual_cjs: Strings,
    virtual_esm: Strings,
    lookups: Vec<MockLookup>,
}

struct MockLookup {
    specifier: String,
    pos: u32,
    esm: bool,
}

impl Jest {
    fn enter(&mut self, kind: AstKind<'_>, s: &mut State<'_, '_>) {
        match kind {
            AstKind::Program(program) => {
                self.names.clear();
                self.virtual_cjs.clear();
                self.virtual_esm.clear();
                self.lookups.clear();
                self.names.insert("jest".to_owned());
                named_imports(program, "@jest/globals", &["jest"], &mut self.names);
            }
            AstKind::CallExpression(call) => {
                let Some(argument) = call.arguments.first() else {
                    return;
                };
                let Some(specifier) = argument_string(argument) else {
                    return;
                };
                let Expression::StaticMemberExpression(member) = &call.callee else {
                    return;
                };
                let Expression::Identifier(id) = &member.object else {
                    return;
                };
                if !self.names.contains(id.name.as_str()) || s.is_shadowed(&id.name, id.span.start)
                {
                    return;
                }
                let method = member.property.name.as_str();
                if !matches!(
                    method,
                    "mock"
                        | "doMock"
                        | "requireActual"
                        | "requireMock"
                        | "createMockFromModule"
                        | "unmock"
                        | "dontMock"
                        | "deepUnmock"
                        | "setMock"
                        | "unstable_mockModule"
                        | "unstable_unmockModule"
                ) {
                    return;
                }
                if matches!(method, "mock" | "doMock" | "unstable_mockModule") {
                    if let Some(Argument::ObjectExpression(options)) = call.arguments.get(2) {
                        for prop in &options.properties {
                            if let ObjectPropertyKind::ObjectProperty(prop) = prop {
                                if !prop.computed
                                    && key_name(&prop.key).as_deref() == Some("virtual")
                                    && matches!(&prop.value, Expression::BooleanLiteral(literal) if literal.value)
                                {
                                    if method == "unstable_mockModule" {
                                        self.virtual_esm.insert(specifier);
                                    } else {
                                        self.virtual_cjs.insert(specifier);
                                    }
                                    return;
                                }
                            }
                        }
                    }
                }
                if matches!(method, "requireActual" | "createMockFromModule") {
                    add_import(
                        s,
                        &specifier,
                        argument.span().start,
                        if method == "requireActual" {
                            OPAQUE
                        } else {
                            SIDE_EFFECTS
                        },
                    );
                } else {
                    self.lookups.push(MockLookup {
                        specifier,
                        pos: argument.span().start,
                        esm: matches!(method, "unstable_mockModule" | "unstable_unmockModule"),
                    });
                }
            }
            _ => {}
        }
    }
}

struct Mock {
    rstest: bool,
    names: Strings,
}

impl Mock {
    fn enter(&mut self, kind: AstKind<'_>, s: &mut State<'_, '_>) {
        match kind {
            AstKind::Program(program) => {
                self.names.clear();
                if self.rstest {
                    named_imports(program, "@rstest/core", &["rs", "rstest"], &mut self.names);
                } else {
                    named_imports(program, "vitest", &["vi"], &mut self.names);
                }
            }
            AstKind::CallExpression(call) => {
                let Some(Argument::ImportExpression(import)) = call.arguments.first() else {
                    return;
                };
                let Some(specifier) = string_value(&import.source) else {
                    return;
                };
                let Some(Argument::ArrowFunctionExpression(factory)) = call.arguments.get(1) else {
                    return;
                };
                if factory.r#async
                    || !factory.params.items.is_empty()
                    || factory.params.rest.is_some()
                {
                    return;
                }
                let ArrowFunctionBody::ParenthesizedExpression(body) = &factory.body else {
                    return;
                };
                let Expression::ObjectExpression(object) = &body.expression else {
                    return;
                };
                if object
                    .properties
                    .iter()
                    .any(|prop| matches!(prop, ObjectPropertyKind::SpreadProperty(_)))
                {
                    return;
                }
                let Expression::StaticMemberExpression(member) = &call.callee else {
                    return;
                };
                let Expression::Identifier(id) = &member.object else {
                    return;
                };
                if !self.names.contains(id.name.as_str())
                    || s.is_shadowed(&id.name, id.span.start)
                    || !(member.property.name == "mock"
                        || self.rstest && member.property.name == "doMock")
                {
                    return;
                }
                s.handled_import_expressions.insert(import.span.start);
                add_import(s, &specifier, import.source.span().start, SIDE_EFFECTS);
            }
            _ => {}
        }
    }
}

fn bun(kind: AstKind<'_>, s: &mut State<'_, '_>) {
    if let AstKind::TaggedTemplateExpression(node) = kind {
        if matches!(&node.tag, Expression::Identifier(id) if id.name == "$") {
            let script = script_from_template(&node.quasi);
            if !script.is_empty() {
                s.scripts.insert(script);
            }
        }
    }
}

fn execa(kind: AstKind<'_>, s: &mut State<'_, '_>) {
    match kind {
        AstKind::TaggedTemplateExpression(node) => {
            let name = match &node.tag {
                Expression::Identifier(id) => id.name.as_str(),
                Expression::CallExpression(call) => match &call.callee {
                    Expression::Identifier(id) => id.name.as_str(),
                    _ => return,
                },
                _ => return,
            };
            if !matches!(name, "$" | "$sync" | "execaNode") {
                return;
            }
            let script = script_from_template(&node.quasi);
            if !script.is_empty() {
                s.scripts.insert(if name == "execaNode" {
                    format!("node {script}")
                } else {
                    script
                });
            }
        }
        AstKind::CallExpression(call) => {
            let Expression::Identifier(id) = &call.callee else {
                return;
            };
            let name = id.name.as_str();
            if !matches!(
                name,
                "execa" | "execaSync" | "execaCommand" | "execaCommandSync" | "execaNode" | "$sync"
            ) {
                return;
            }
            let Some(arg) = call.arguments.first() else {
                return;
            };
            let script = if name.starts_with("execaCommand") {
                script_from_arg(arg)
            } else {
                safe_script_from_args(arg, call.arguments.get(1))
            };
            if let Some(script) = script.filter(|v| !v.is_empty()) {
                s.scripts.insert(if name == "execaNode" {
                    format!("node {script}")
                } else {
                    script
                });
            }
        }
        _ => {}
    }
}

fn nano_spawn(kind: AstKind<'_>, s: &mut State<'_, '_>) {
    if let AstKind::CallExpression(call) = kind {
        if matches!(&call.callee, Expression::Identifier(id) if id.name == "spawn") {
            if let Some(arg) = call.arguments.first() {
                if let Some(script) = safe_script_from_args(arg, call.arguments.get(1)) {
                    s.scripts.insert(script);
                }
            }
        }
    }
}

fn vite(kind: AstKind<'_>, s: &mut State<'_, '_>) {
    let AstKind::CallExpression(call) = kind else {
        return;
    };
    if !named_member(&call.callee).is_some_and(|(object, name)| {
        name == "glob" && matches!(object, Expression::ImportMeta(_) | Expression::NewTarget(_))
    }) {
        return;
    }
    let Some(arg) = call.arguments.first() else {
        return;
    };
    let patterns = if let Some(value) = argument_string(arg) {
        vec![value]
    } else if let Argument::ArrayExpression(array) = arg {
        let mut patterns = Vec::new();
        for element in &array.elements {
            if let Some(value) = element.as_expression().and_then(string_value) {
                patterns.push(value);
            }
        }
        patterns
    } else {
        return;
    };
    if patterns.is_empty() {
        return;
    }
    let mut raw = false;
    if let Some(Argument::ObjectExpression(options)) = call.arguments.get(1) {
        raw = find_property(options, "as")
            .and_then(string_value)
            .as_deref()
            == Some("raw");
        if let Some(query) = find_property(options, "query") {
            if let Some(value) = string_value(query) {
                let value = if value.starts_with('?') {
                    value
                } else {
                    format!("?{value}")
                };
                raw |= value.match_indices("raw").any(|(index, _)| {
                    index > 0
                        && matches!(value.as_bytes()[index - 1], b'?' | b'&')
                        && (index + 3 == value.len() || value.as_bytes()[index + 3] == b'&')
                });
            }
            if let Expression::ObjectExpression(query) = query {
                raw |= find_property(query, "raw")
                    .and_then(string_value)
                    .as_deref()
                    == Some("");
            }
        }
    }
    s.import_globs.push(ImportGlob {
        patterns,
        analyze_exports: raw.then_some(true),
        ..ImportGlob::default()
    });
}

fn webpack(kind: AstKind<'_>, s: &mut State<'_, '_>) {
    let AstKind::CallExpression(call) = kind else {
        return;
    };
    if !named_member(&call.callee).is_some_and(|(object, name)| {
        name == "context" && matches!(object, Expression::Identifier(id) if id.name == "require")
    }) {
        return;
    }
    let Some(base) = call.arguments.first().and_then(argument_string) else {
        return;
    };
    let recursive =
        !matches!(call.arguments.get(1), Some(Argument::BooleanLiteral(literal)) if !literal.value);
    let filter = match call.arguments.get(2) {
        Some(Argument::RegExpLiteral(literal)) => Some((
            encode_literal(&literal.regex.pattern.text, false),
            literal.regex.flags.to_string(),
        )),
        _ => None,
    };
    if let Some((pattern, flags)) = &filter {
        if !s.validate_reg_exp(pattern, flags) {
            return;
        }
    }
    s.import_globs.push(ImportGlob {
        patterns: vec![if recursive { "**/*" } else { "*" }.to_owned()],
        base: Some(base),
        filter,
        ..ImportGlob::default()
    });
}

#[derive(Default)]
struct Bindings {
    names: Strings,
    namespaces: Strings,
}

fn node_glob(kind: AstKind<'_>, bindings: &mut Bindings, s: &mut State<'_, '_>) {
    match kind {
        AstKind::Program(_) => {
            bindings.names.clear();
            bindings.namespaces.clear();
        }
        AstKind::ImportDeclaration(import)
            if matches!(
                import.source.value.as_str(),
                "node:fs/promises" | "fs/promises"
            ) =>
        {
            if let Some(specifiers) = &import.specifiers {
                for specifier in specifiers {
                    match specifier {
                        ImportDeclarationSpecifier::ImportNamespaceSpecifier(specifier) => {
                            bindings.namespaces.insert(specifier.local.name.to_string());
                        }
                        ImportDeclarationSpecifier::ImportSpecifier(specifier) if matches!(&specifier.imported, ModuleExportName::IdentifierName(id) if id.name == "glob") =>
                        {
                            bindings.names.insert(specifier.local.name.to_string());
                        }
                        _ => {}
                    }
                }
            }
        }
        AstKind::VariableDeclarator(node) => {
            if !require_source(node)
                .is_some_and(|source| matches!(source.as_str(), "node:fs/promises" | "fs/promises"))
            {
                return;
            }
            match &node.id {
                BindingPattern::BindingIdentifier(id) => {
                    bindings.namespaces.insert(id.name.to_string());
                }
                BindingPattern::ObjectPattern(pattern) => {
                    for prop in &pattern.properties {
                        if key_name(&prop.key).as_deref() == Some("glob") {
                            if let BindingPattern::BindingIdentifier(id) = &prop.value {
                                bindings.names.insert(id.name.to_string());
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        AstKind::CallExpression(call) => {
            let glob = match &call.callee {
                Expression::Identifier(id) => bindings.names.contains(id.name.as_str()),
                Expression::StaticMemberExpression(member) => {
                    member.property.name == "glob"
                        && matches!(&member.object, Expression::Identifier(id) if bindings.namespaces.contains(id.name.as_str()))
                }
                _ => false,
            };
            if !glob {
                return;
            }
            let Some(arg) = call.arguments.first() else {
                return;
            };
            let patterns = if let Some(pattern) = argument_string(arg) {
                vec![pattern]
            } else if let Argument::ArrayExpression(array) = arg {
                let mut patterns = Vec::with_capacity(array.elements.len());
                for element in &array.elements {
                    let Some(value) = element.as_expression().and_then(string_value) else {
                        return;
                    };
                    patterns.push(value);
                }
                patterns
            } else {
                return;
            };
            if patterns.is_empty() || patterns.iter().any(|pattern| pattern.starts_with('!')) {
                return;
            }
            let mut cwd = ".".to_owned();
            if let Some(arg) = call.arguments.get(1) {
                let Argument::ObjectExpression(options) = arg else {
                    return;
                };
                if options.properties.len() > 1 {
                    return;
                }
                for prop in &options.properties {
                    let ObjectPropertyKind::ObjectProperty(prop) = prop else {
                        return;
                    };
                    if prop.computed || key_name(&prop.key).as_deref() != Some("cwd") {
                        return;
                    }
                    let Some(value) = string_value(&prop.value) else {
                        return;
                    };
                    cwd = value;
                }
            }
            s.import_globs.push(ImportGlob {
                patterns,
                cwd: Some(cwd),
                ..ImportGlob::default()
            });
        }
        _ => {}
    }
}

fn require_source(node: &VariableDeclarator<'_>) -> Option<String> {
    let Expression::CallExpression(call) = node.init.as_ref()? else {
        return None;
    };
    if !matches!(&call.callee, Expression::Identifier(id) if id.name == "require") {
        return None;
    }
    call.arguments.first().and_then(argument_string)
}

fn knex(kind: AstKind<'_>, bindings: &mut Bindings, s: &mut State<'_, '_>) {
    match kind {
        AstKind::Program(_) => {
            bindings.names.clear();
            bindings.namespaces.clear();
        }
        AstKind::ImportDeclaration(import) if import.source.value == "knex" => {
            if let Some(specifiers) = &import.specifiers {
                for specifier in specifiers {
                    match specifier {
                        ImportDeclarationSpecifier::ImportDefaultSpecifier(specifier) => {
                            bindings.namespaces.insert(specifier.local.name.to_string());
                        }
                        ImportDeclarationSpecifier::ImportSpecifier(specifier) if matches!(&specifier.imported, ModuleExportName::IdentifierName(id) if id.name == "knex") =>
                        {
                            bindings.names.insert(specifier.local.name.to_string());
                        }
                        _ => {}
                    }
                }
            }
        }
        AstKind::VariableDeclarator(node) if require_source(node).as_deref() == Some("knex") => {
            match &node.id {
                BindingPattern::BindingIdentifier(id) => {
                    bindings.namespaces.insert(id.name.to_string());
                }
                BindingPattern::ObjectPattern(pattern) => {
                    for prop in &pattern.properties {
                        if matches!(&prop.key, PropertyKey::StaticIdentifier(id) if id.name == "knex")
                            || matches!(&prop.key, PropertyKey::Identifier(id) if id.name == "knex")
                        {
                            if let BindingPattern::BindingIdentifier(id) = &prop.value {
                                bindings.names.insert(id.name.to_string());
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        AstKind::CallExpression(call) => {
            let matched = match &call.callee {
                Expression::Identifier(id) => {
                    bindings.names.contains(id.name.as_str())
                        || bindings.namespaces.contains(id.name.as_str())
                }
                Expression::StaticMemberExpression(member) => {
                    member.property.name == "knex"
                        && matches!(&member.object, Expression::Identifier(id) if bindings.namespaces.contains(id.name.as_str()))
                }
                _ => false,
            };
            if !matched {
                return;
            }
            let Some(Argument::ObjectExpression(object)) = call.arguments.first() else {
                return;
            };
            for prop in &object.properties {
                let ObjectPropertyKind::ObjectProperty(prop) = prop else {
                    continue;
                };
                if prop.computed
                    || !matches!(&prop.key, PropertyKey::StaticIdentifier(id) if id.name == "client")
                {
                    continue;
                }
                let Some(client) = string_value(&prop.value) else {
                    return;
                };
                let packages: &[&str] = match client.to_lowercase().as_str() {
                    "pg" | "postgres" | "postgresql" | "cockroachdb" | "redshift" => &["pg"],
                    "mysql" => &["mysql", "mysql2"],
                    "mysql2" => &["mysql2"],
                    "sqlite3" => &["sqlite3"],
                    "better-sqlite3" => &["better-sqlite3"],
                    "mssql" | "tedious" => &["tedious"],
                    "oracle" | "oracledb" => &["oracledb"],
                    _ => &[],
                };
                for package in packages {
                    add_import(s, package, object.span.start, 0);
                }
                return;
            }
        }
        _ => {}
    }
}

#[derive(Default)]
struct Pino {
    name: Option<String>,
    transport: Option<String>,
}

impl Pino {
    fn enter(&mut self, kind: AstKind<'_>, s: &mut State<'_, '_>) {
        match kind {
            AstKind::Program(_) => {
                self.name = None;
                self.transport = None;
            }
            AstKind::ImportDeclaration(import) if import.source.value == "pino" => {
                if let Some(specifiers) = &import.specifiers {
                    for specifier in specifiers {
                        match specifier {
                            ImportDeclarationSpecifier::ImportDefaultSpecifier(specifier) => {
                                self.name = Some(specifier.local.name.to_string())
                            }
                            ImportDeclarationSpecifier::ImportSpecifier(specifier) if matches!(&specifier.imported, ModuleExportName::IdentifierName(id) if id.name == "transport") => {
                                self.transport = Some(specifier.local.name.to_string())
                            }
                            _ => {}
                        }
                    }
                }
            }
            AstKind::VariableDeclarator(node) if self.name.is_none() => {
                if let BindingPattern::BindingIdentifier(id) = &node.id {
                    if require_source(node).as_deref() == Some("pino") {
                        self.name = Some(id.name.to_string());
                    }
                }
            }
            AstKind::CallExpression(call) => {
                if self.name.is_none() && self.transport.is_none() {
                    return;
                }
                let Some(Argument::ObjectExpression(object)) = call.arguments.first() else {
                    return;
                };
                let transport = match &call.callee {
                    Expression::Identifier(id) => {
                        self.transport.as_deref() == Some(id.name.as_str())
                    }
                    Expression::StaticMemberExpression(member) => {
                        member.property.name == "transport"
                            && matches!(&member.object, Expression::Identifier(id) if self.name.as_deref() == Some(id.name.as_str()))
                    }
                    _ => false,
                };
                if transport {
                    pino_targets(object, s);
                    return;
                }
                if matches!(&call.callee, Expression::Identifier(id) if self.name.as_deref() == Some(id.name.as_str()))
                {
                    for prop in &object.properties {
                        if let ObjectPropertyKind::ObjectProperty(prop) = prop {
                            if !prop.computed
                                && matches!(&prop.key, PropertyKey::StaticIdentifier(id) if id.name == "transport")
                            {
                                if let Expression::ObjectExpression(object) = &prop.value {
                                    pino_targets(object, s);
                                }
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

fn pino_targets(object: &ObjectExpression<'_>, s: &mut State<'_, '_>) {
    for prop in &object.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            continue;
        };
        if prop.computed {
            continue;
        }
        let PropertyKey::StaticIdentifier(key) = &prop.key else {
            continue;
        };
        if key.name == "target" {
            if let Some(specifier) = string_value(&prop.value) {
                let internal = (specifier.starts_with('.') || specifier.starts_with('/'))
                    && !specifier.contains("node_modules");
                add_import(
                    s,
                    &specifier,
                    prop.value.span().start,
                    if internal { ENTRY } else { 0 },
                );
            }
        } else if matches!(key.name.as_str(), "targets" | "pipeline") {
            if let Expression::ArrayExpression(array) = &prop.value {
                for element in &array.elements {
                    if let ArrayExpressionElement::ObjectExpression(object) = element {
                        pino_targets(object, s);
                    }
                }
            }
        }
    }
}

enum CustomKind {
    Lit,
    Fast,
    Catalyst,
    Stencil,
}

struct CustomElements {
    kind: CustomKind,
    names: Strings,
    namespaces: Strings,
    bases: Strings,
    defined: Strings,
    depth: u32,
}

impl CustomElements {
    fn new(kind: CustomKind) -> Self {
        Self {
            kind,
            names: Strings::new(),
            namespaces: Strings::new(),
            bases: Strings::new(),
            defined: Strings::new(),
            depth: 0,
        }
    }

    fn decorator(&self) -> &str {
        match self.kind {
            CustomKind::Catalyst => "controller",
            CustomKind::Stencil => "Component",
            _ => "customElement",
        }
    }

    fn source(&self, source: &str) -> bool {
        match self.kind {
            CustomKind::Fast => source == "@microsoft/fast-element",
            CustomKind::Catalyst => source == "@github/catalyst",
            CustomKind::Stencil => source == "@stencil/core",
            CustomKind::Lit => {
                matches!(
                    source,
                    "lit/decorators.js"
                        | "lit/decorators"
                        | "@lit/reactive-element/decorators.js"
                        | "@lit/reactive-element/decorators"
                        | "lit-element"
                        | "lit-element/decorators.js"
                        | "lit-element/decorators"
                ) || source.starts_with("lit/decorators/")
                    || source.starts_with("@lit/reactive-element/decorators/")
                    || source.starts_with("lit-element/decorators/")
            }
        }
    }

    fn decorated(&self, class: &Class<'_>) -> bool {
        for decorator in &class.decorators {
            match &decorator.expression {
                Expression::Identifier(id) if self.names.contains(id.name.as_str()) => return true,
                Expression::CallExpression(call) => match &call.callee {
                    Expression::Identifier(id) if self.names.contains(id.name.as_str()) => {
                        return true;
                    }
                    Expression::StaticMemberExpression(member)
                        if member.property.name == self.decorator()
                            && matches!(&member.object, Expression::Identifier(id) if self.namespaces.contains(id.name.as_str())) =>
                    {
                        return true;
                    }
                    _ => {}
                },
                _ => {}
            }
        }
        false
    }

    fn enter(&mut self, kind: AstKind<'_>, s: &mut State<'_, '_>) {
        match kind {
            AstKind::Program(_) => {
                self.names.clear();
                self.namespaces.clear();
                self.bases.clear();
                self.defined.clear();
                self.depth = 0;
            }
            AstKind::BlockStatement(_) | AstKind::FunctionBody(_) => self.depth += 1,
            AstKind::ImportDeclaration(import) if self.source(&import.source.value) => {
                if let Some(specifiers) = &import.specifiers {
                    for specifier in specifiers {
                        match specifier {
                            ImportDeclarationSpecifier::ImportSpecifier(specifier) => {
                                if let ModuleExportName::IdentifierName(id) = &specifier.imported {
                                    if id.name == self.decorator() {
                                        self.names.insert(specifier.local.name.to_string());
                                    } else if matches!(self.kind, CustomKind::Fast)
                                        && id.name == "FASTElement"
                                    {
                                        self.bases.insert(specifier.local.name.to_string());
                                    }
                                }
                            }
                            ImportDeclarationSpecifier::ImportNamespaceSpecifier(specifier) => {
                                self.namespaces.insert(specifier.local.name.to_string());
                            }
                            _ => {}
                        }
                    }
                }
            }
            AstKind::Class(class)
                if class.r#type == ClassType::ClassDeclaration && self.depth == 0 =>
            {
                let Some(id) = &class.id else {
                    return;
                };
                if self.decorated(class) {
                    s.registered_custom_elements.insert(id.name.to_string());
                } else if matches!(self.kind, CustomKind::Fast) {
                    let Some(heritage) = &class.heritage else {
                        return;
                    };
                    let extends = match &heritage.expression {
                        Expression::Identifier(id) => self.bases.contains(id.name.as_str()),
                        Expression::CallExpression(call) => call.arguments.iter().any(|arg| matches!(arg, Argument::Identifier(id) if self.bases.contains(id.name.as_str()))),
                        _ => false,
                    };
                    if extends {
                        self.defined.insert(id.name.to_string());
                    }
                }
            }
            AstKind::ExportDefaultDeclaration(export) => {
                if let ExportDefaultDeclarationKind::ClassDeclaration(class) = &export.declaration {
                    if self.decorated(class) {
                        s.registered_custom_elements.insert("default".to_owned());
                    }
                }
            }
            AstKind::CallExpression(call) if matches!(self.kind, CustomKind::Fast) => {
                if let Expression::StaticMemberExpression(member) = &call.callee {
                    if matches!(member.property.name.as_str(), "define" | "defineAsync") {
                        if let Expression::Identifier(id) = &member.object {
                            if self.defined.contains(id.name.as_str()) {
                                s.registered_custom_elements.insert(id.name.to_string());
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

struct Styles {
    angular: bool,
    names: Strings,
}

impl Styles {
    fn enter(&mut self, kind: AstKind<'_>, s: &mut State<'_, '_>) {
        match kind {
            AstKind::Program(_) => self.names.clear(),
            AstKind::ImportDeclaration(import)
                if import.source.value
                    == if self.angular {
                        "@angular/core"
                    } else {
                        "@stencil/core"
                    } =>
            {
                if let Some(specifiers) = &import.specifiers {
                    for specifier in specifiers {
                        if let ImportDeclarationSpecifier::ImportSpecifier(specifier) = specifier {
                            if matches!(&specifier.imported, ModuleExportName::IdentifierName(id) if id.name == "Component")
                            {
                                self.names.insert(specifier.local.name.to_string());
                            }
                        }
                    }
                }
            }
            AstKind::Class(class)
                if class.r#type == ClassType::ClassDeclaration && !self.names.is_empty() =>
            {
                for decorator in &class.decorators {
                    let Expression::CallExpression(call) = &decorator.expression else {
                        continue;
                    };
                    if !matches!(&call.callee, Expression::Identifier(id) if self.names.contains(id.name.as_str()))
                    {
                        continue;
                    }
                    let Some(Argument::ObjectExpression(object)) = call.arguments.first() else {
                        continue;
                    };
                    for name in ["styleUrl", "styleUrls"] {
                        for url in property_values(object, name) {
                            let path = style_path(
                                s.file_path,
                                &url,
                                s.options.path_strings_lossy.unwrap_or(false),
                            );
                            add_import(s, &path, object.span.start, 0);
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

fn property_values(object: &ObjectExpression<'_>, name: &str) -> Strings {
    let mut values = Strings::new();
    for prop in &object.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            continue;
        };
        if key_name(&prop.key).as_deref() != Some(name) {
            continue;
        }
        match &prop.value {
            Expression::ArrayExpression(array) => {
                for element in &array.elements {
                    if let Some(value) = element.as_expression().and_then(string_value) {
                        values.insert(value);
                    }
                }
            }
            Expression::ObjectExpression(object) => {
                for prop in &object.properties {
                    if let ObjectPropertyKind::ObjectProperty(prop) = prop {
                        if let Some(value) = string_value(&prop.value) {
                            values.insert(value);
                        }
                    }
                }
            }
            value => {
                if let Some(value) = string_value(value) {
                    values.insert(value);
                }
            }
        }
    }
    values
}

fn style_path(file_path: &str, url: &str, lossy: bool) -> String {
    let style = crate::resolver::path::PathStyle {
        lossy,
        windows: false,
    };
    let dir = style.dirname(&super::common::utf16(file_path));
    super::common::encode_utf16(&style.join(&[&dir, &super::common::utf16(url)]))
}
