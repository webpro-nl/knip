use super::{common::*, exports, imports, members, plugins::Plugins, state::*};
use oxc_ast::{AstKind, ast::*};
use oxc_ast_visit::Visit;
use oxc_span::{GetSpan, Span};

pub struct Walker<'a, 's, 'h> {
    pub state: &'s mut State<'a, 'h>,
    pub plugins: Plugins,
}
impl<'a> Visit<'a> for Walker<'a, '_, '_> {
    fn enter_node(&mut self, kind: AstKind<'a>) {
        core_enter(kind, self.state);
        exports::enter(kind, self.state);
        imports::enter(kind, self.state);
        members::enter(kind, self.state);
        if self.state.local_refs.is_some() {
            local_enter(kind, self.state);
        }
        self.plugins.enter(kind, self.state);
    }
    fn leave_node(&mut self, kind: AstKind<'a>) {
        match kind {
            AstKind::BlockStatement(_) | AstKind::FunctionBody(_) => {
                self.state.scopes.pop();
            }
            AstKind::Class(_) => {
                self.state.class_name_stack.pop();
            }
            AstKind::StaticBlock(_) => {
                self.state.static_block_depth -= 1;
            }
            _ => {}
        }
        self.plugins.leave(kind, self.state);
    }
}

fn shadows(pattern: &BindingPattern<'_>, range: Span, s: &mut State<'_, '_>) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            s.shadow_scopes
                .entry(id.name.to_string())
                .or_default()
                .push(range);
        }
        BindingPattern::ObjectPattern(obj) => {
            for p in &obj.properties {
                shadows(&p.value, range, s);
            }
            if let Some(rest) = &obj.rest {
                shadows(&rest.argument, range, s);
            }
        }
        BindingPattern::ArrayPattern(arr) => {
            for p in arr.elements.iter().flatten() {
                shadows(p, range, s);
            }
            if let Some(rest) = &arr.rest {
                shadows(&rest.argument, range, s);
            }
        }
        BindingPattern::AssignmentPattern(p) => shadows(&p.left, range, s),
    }
}
fn param_shadows(params: &FormalParameters<'_>, range: Span, s: &mut State<'_, '_>) {
    for p in &params.items {
        if p.accessibility.is_none() && !p.readonly && !p.r#override {
            shadows(&p.pattern, range, s);
        }
    }
    if let Some(rest) = &params.rest {
        shadows(&rest.rest.argument, range, s);
    }
}
fn loop_enter(
    left: &ForStatementLeft<'_>,
    right: &Expression<'_>,
    body: &Statement<'_>,
    s: &mut State<'_, '_>,
) {
    if let ForStatementLeft::VariableDeclaration(decl) = left {
        for d in &decl.declarations {
            shadows(&d.id, body.span(), s);
        }
    }
    if let Expression::Identifier(id) = right {
        if !s.is_shadowed(&id.name, id.span.start) {
            if let Some(import) = s
                .local_import_map
                .get(id.name.as_str())
                .filter(|i| i.is_namespace)
            {
                if let Some(map) = s.internal.get_mut(&import.file_path) {
                    add_value(&mut map.import, "__opaque", s.file_path);
                }
            }
        }
    }
}
fn imported_type_ref(id: &IdentifierReference<'_>, s: &mut State<'_, '_>) {
    if !s.is_shadowed(&id.name, id.span.start) {
        if let Some(import) = s.local_import_map.get(id.name.as_str()) {
            if let Some(map) = s.internal.get_mut(&import.file_path) {
                map.refs.insert(id.name.to_string());
            }
        }
    }
}
fn qualified_parts<'a>(
    node: &'a TSQualifiedName<'a>,
) -> (Option<&'a IdentifierReference<'a>>, Vec<&'a str>) {
    let mut parts = vec![node.right.name.as_str()];
    let mut left = &node.left;
    while let TSTypeName::QualifiedName(node) = left {
        parts.push(&node.right.name);
        left = &node.left;
    }
    parts.reverse();
    let root = if let TSTypeName::IdentifierReference(id) = left {
        Some(id.as_ref())
    } else {
        None
    };
    (root, parts)
}
fn import_qualified_parts<'a>(
    node: &'a TSImportTypeQualifiedName<'a>,
) -> (&'a IdentifierName<'a>, Vec<&'a str>) {
    let mut parts = vec![node.right.name.as_str()];
    let mut left = &node.left;
    while let TSImportTypeQualifier::QualifiedName(node) = left {
        parts.push(&node.right.name);
        left = &node.left;
    }
    parts.reverse();
    let TSImportTypeQualifier::Identifier(root) = left else {
        unreachable!()
    };
    (root, parts)
}
fn qualified_ref(name: &str, byte: u32, parts: Vec<&str>, s: &mut State<'_, '_>) {
    if s.is_shadowed(name, byte) {
        return;
    }
    let mut path = String::new();
    if let Some(import) = s.local_import_map.get(name) {
        if let Some(map) = s.internal.get_mut(&import.file_path) {
            for part in parts {
                if !path.is_empty() {
                    path.push('.');
                }
                path.push_str(part);
                add_ns_member_ref(map, name, &path);
            }
        }
    } else {
        for part in parts {
            if !path.is_empty() {
                path.push('.');
            }
            path.push_str(part);
            s.member_refs_in_file.push((name.to_owned(), path.clone()));
        }
    }
}
fn mark_type_members(name: &TSTypeName<'_>, s: &mut State<'_, '_>) {
    let mut name = name;
    while let TSTypeName::QualifiedName(member) = name {
        s.type_member_exprs
            .insert((member.span.start, member.span.end));
        name = &member.left;
    }
}
fn core_enter<'a>(kind: AstKind<'a>, s: &mut State<'a, '_>) {
    match kind {
        AstKind::BlockStatement(n) => s.scopes.push(n.span),
        AstKind::FunctionBody(n) => s.scopes.push(n.span),
        AstKind::TSNamespaceDeclaration(n) => {
            s.ns_ranges.push(n.span);
            if !s
                .dotted_namespace_children
                .contains(&(n.span.start, n.span.end))
            {
                let mut body = &n.body;
                let mut parts = Vec::new();
                while let TSNamespaceDeclarationBody::TSNamespaceDeclaration(inner) = body {
                    s.dotted_namespace_children
                        .insert((inner.span.start, inner.span.end));
                    parts.push(inner.id.name.as_str());
                    body = &inner.body;
                }
                if !parts.is_empty() {
                    qualified_ref(&n.id.name, n.id.span.start, parts, s);
                    if !s.local_import_map.contains_key(n.id.name.as_str()) {
                        s.add_local_ref(&n.id.name, n.id.span.start);
                    }
                }
            }
        }
        AstKind::TSGlobalDeclaration(n) => s.ns_ranges.push(n.span),
        AstKind::TSExternalModuleDeclaration(n) => {
            s.ns_ranges.push(n.span);
            if let Some(body) = &n.body {
                if s.is_module_file {
                    let specifier = encode_literal(&n.id.value, n.id.lone_surrogates);
                    for name in augmentation_refs(body) {
                        s.add_import(
                            &specifier,
                            Some(&name),
                            None,
                            None,
                            n.id.span.start,
                            TYPE_ONLY | AUGMENT,
                            None,
                            None,
                            None,
                        );
                    }
                } else {
                    for statement in &body.body {
                        let source = match statement {
                            Statement::ImportDeclaration(n) => Some(&n.source),
                            Statement::ExportFromDeclaration(n) => Some(&n.source),
                            Statement::ExportAllDeclaration(n) => Some(&n.source),
                            _ => None,
                        };
                        if let Some(source) = source {
                            s.add_import(
                                &encode_literal(&source.value, source.lone_surrogates),
                                None,
                                None,
                                None,
                                source.span.start,
                                TYPE_ONLY | OPAQUE,
                                None,
                                None,
                                None,
                            );
                        }
                    }
                }
            }
        }
        AstKind::TSInterfaceDeclaration(n) => {
            if s.scopes.is_empty() && !s.is_in_namespace(n.span) {
                let name = n.id.name.to_string();
                let value = if s.local_interfaces.contains_key(&name) {
                    None
                } else {
                    Some(n)
                };
                s.local_interfaces.insert(name, value);
            }
        }
        AstKind::Class(n) => {
            s.class_name_stack.push(
                n.id.as_ref()
                    .map_or_else(String::new, |id| id.name.to_string()),
            );
            if n.r#type == ClassType::ClassDeclaration {
                if let Some(id) = &n.id {
                    s.local_declaration_types
                        .insert(id.name.to_string(), "class".into());
                    s.local_declarations.insert(id.name.to_string(), kind);
                }
            }
        }
        AstKind::StaticBlock(_) => s.static_block_depth += 1,
        AstKind::Function(n) => {
            if n.r#type == FunctionType::FunctionDeclaration {
                if let Some(id) = &n.id {
                    s.local_declaration_types
                        .insert(id.name.to_string(), "function".into());
                    s.local_declarations.insert(id.name.to_string(), kind);
                    if let Some(range) = s.scopes.last() {
                        s.shadow_scopes
                            .entry(id.name.to_string())
                            .or_default()
                            .push(*range);
                    }
                }
            }
            if n.r#type != FunctionType::TSDeclareFunction {
                if let Some(body) = &n.body {
                    param_shadows(&n.params, body.span, s);
                }
            }
        }
        AstKind::ArrowFunctionExpression(n) => param_shadows(&n.params, n.body.span(), s),
        AstKind::CatchClause(n) => {
            if let Some(param) = &n.param {
                if let BindingPattern::BindingIdentifier(id) = &param.pattern {
                    s.shadow_scopes
                        .entry(id.name.to_string())
                        .or_default()
                        .push(n.body.span);
                }
            }
        }
        AstKind::VariableDeclaration(n) => {
            s.current_var_decl_start = Some(n.span.start);
            for d in &n.declarations {
                if let BindingPattern::BindingIdentifier(id) = &d.id {
                    s.local_declaration_types
                        .insert(id.name.to_string(), "variable".into());
                    if let Some(range) = s.scopes.last() {
                        s.shadow_scopes
                            .entry(id.name.to_string())
                            .or_default()
                            .push(*range);
                    } else {
                        s.local_declarations
                            .insert(id.name.to_string(), AstKind::VariableDeclarator(d));
                    }
                }
            }
        }
        AstKind::TSEnumDeclaration(n) => {
            s.local_declaration_types
                .insert(n.id.name.to_string(), "enum".into());
        }
        AstKind::ForInStatement(n) => loop_enter(&n.left, &n.right, &n.body, s),
        AstKind::ForOfStatement(n) => loop_enter(&n.left, &n.right, &n.body, s),
        AstKind::ArrayExpression(n) => {
            for element in &n.elements {
                if let ArrayExpressionElement::Identifier(id) = element {
                    if let Some(import) = s
                        .local_import_map
                        .get(id.name.as_str())
                        .filter(|i| i.is_namespace)
                    {
                        if let Some(map) = s.internal.get_mut(&import.file_path) {
                            add_value(&mut map.import, "__opaque", s.file_path);
                        }
                    }
                }
            }
        }
        AstKind::TSClassImplements(n) => mark_type_members(&n.expression, s),
        AstKind::TSInterfaceHeritage(n) => mark_type_members(&n.type_name, s),
        AstKind::TSQualifiedName(n) => {
            if s.type_member_exprs.contains(&(n.span.start, n.span.end)) {
                members::qualified_enter(n, s);
                return;
            }
            let (root, parts) = qualified_parts(n);
            if let Some(root) = root {
                qualified_ref(&root.name, root.span.start, parts, s);
            }
        }
        AstKind::TSImportTypeQualifiedName(n) => {
            let (root, parts) = import_qualified_parts(n);
            qualified_ref(&root.name, root.span.start, parts, s);
        }
        AstKind::TSTypeReference(n) => {
            if let TSTypeName::IdentifierReference(id) = &n.type_name {
                imported_type_ref(id, s);
            }
        }
        AstKind::TSTypeQuery(n) => {
            if let TSTypeQueryExprName::IdentifierReference(id) = &n.expr_name {
                imported_type_ref(id, s);
            }
        }
        AstKind::TSImportType(n) => {
            s.add_import(
                &encode_literal(&n.source.value, n.source.lone_surrogates),
                None,
                None,
                None,
                n.source.span.start,
                TYPE_ONLY,
                None,
                None,
                None,
            );
        }
        AstKind::TSImportEqualsDeclaration(n) => match &n.module_reference {
            TSModuleReference::ExternalModuleReference(reference) => {
                let specifier = encode_literal(
                    &reference.expression.value,
                    reference.expression.lone_surrogates,
                );
                s.add_import(
                    &specifier,
                    Some("default"),
                    Some(&n.id.name),
                    None,
                    n.id.span.start,
                    0,
                    None,
                    None,
                    None,
                );
                let resolved = s.resolve_module(&specifier);
                if !resolved.is_external_library_import.unwrap_or(false) {
                    if let Some(path) = resolved.resolved_file_name.filter(|p| !in_node_modules(p))
                    {
                        s.local_import_map.insert(
                            n.id.name.to_string(),
                            LocalImport {
                                imported_name: "default".into(),
                                file_path: path,
                                is_namespace: false,
                                is_dynamic_import: false,
                            },
                        );
                    }
                }
            }
            TSModuleReference::QualifiedName(q) => {
                if let TSTypeName::IdentifierReference(id) = &q.left {
                    if let Some(import) = s
                        .local_import_map
                        .get(id.name.as_str())
                        .filter(|i| i.is_namespace)
                    {
                        if let Some(map) = s.internal.get_mut(&import.file_path) {
                            add_ns_member_ref(map, &id.name, &q.right.name);
                        }
                    }
                }
            }
            _ => {}
        },
        _ => {}
    }
}

fn local_expr(expression: &Expression<'_>, s: &mut State<'_, '_>) {
    if let Expression::Identifier(id) = expression {
        s.add_local_ref(&id.name, id.span.start);
    }
}
fn local_enter<'a>(kind: AstKind<'a>, s: &mut State<'a, '_>) {
    match kind {
        AstKind::Class(n) if n.r#type == ClassType::ClassDeclaration => {
            if let Some(super_class) = &n.heritage {
                local_expr(&super_class.expression, s);
            }
            for implementation in &n.implements {
                if let TSTypeName::IdentifierReference(id) = &implementation.expression {
                    s.add_local_ref(&id.name, id.span.start);
                }
            }
        }
        AstKind::TSInterfaceDeclaration(n) => {
            for extension in &n.extends {
                if let TSTypeName::IdentifierReference(id) = &extension.type_name {
                    s.add_local_ref(&id.name, id.span.start);
                }
            }
        }
        AstKind::ObjectProperty(n) => local_expr(&n.value, s),
        AstKind::BindingProperty(n) => {
            if let BindingPattern::BindingIdentifier(id) = &n.value {
                s.add_local_ref(&id.name, id.span.start);
            }
        }
        AstKind::AssignmentTargetPropertyIdentifier(n) => {
            if let Some(init) = &n.init {
                local_expr(init, s);
            } else {
                s.add_local_ref(&n.binding.name, n.binding.span.start);
            }
        }
        AstKind::AssignmentTargetPropertyProperty(n) => {
            if let AssignmentTargetMaybeDefault::AssignmentTargetIdentifier(id) = &n.binding {
                s.add_local_ref(&id.name, id.span.start);
            }
        }
        AstKind::ReturnStatement(n) => {
            if let Some(e) = &n.argument {
                local_expr(e, s);
            }
        }
        AstKind::AssignmentExpression(n) => local_expr(&n.right, s),
        AstKind::SpreadElement(n) => local_expr(&n.argument, s),
        AstKind::ConditionalExpression(n) => {
            local_expr(&n.test, s);
            local_expr(&n.consequent, s);
            local_expr(&n.alternate, s);
        }
        AstKind::ArrayExpression(n) => {
            for e in &n.elements {
                if let Some(e) = e.as_expression() {
                    local_expr(e, s);
                }
            }
        }
        AstKind::TemplateLiteral(n) => {
            for e in &n.expressions {
                local_expr(e, s);
            }
        }
        AstKind::BinaryExpression(n) => {
            local_expr(&n.left, s);
            local_expr(&n.right, s);
        }
        AstKind::PrivateInExpression(n) => local_expr(&n.right, s),
        AstKind::LogicalExpression(n) => {
            local_expr(&n.left, s);
            local_expr(&n.right, s);
        }
        AstKind::UnaryExpression(n) => local_expr(&n.argument, s),
        AstKind::SwitchStatement(n) => {
            local_expr(&n.discriminant, s);
            for case in &n.cases {
                if let Some(test) = &case.test {
                    local_expr(test, s);
                }
            }
        }
        AstKind::IfStatement(n) => local_expr(&n.test, s),
        AstKind::ThrowStatement(n) => local_expr(&n.argument, s),
        AstKind::WhileStatement(n) => local_expr(&n.test, s),
        AstKind::DoWhileStatement(n) => local_expr(&n.test, s),
        AstKind::YieldExpression(n) => {
            if let Some(e) = &n.argument {
                local_expr(e, s);
            }
        }
        AstKind::AwaitExpression(n) => local_expr(&n.argument, s),
        AstKind::ArrowFunctionExpression(n) => {
            if let Some(e) = n.body.as_expression() {
                local_expr(e, s);
            }
        }
        AstKind::AssignmentPattern(n) => local_expr(&n.right, s),
        AstKind::AssignmentTargetWithDefault(n) => local_expr(&n.init, s),
        AstKind::FormalParameter(n) => {
            if let Some(e) = &n.initializer {
                local_expr(e, s);
            }
        }
        AstKind::SequenceExpression(n) => {
            for e in &n.expressions {
                local_expr(e, s);
            }
        }
        AstKind::TSAsExpression(n) => local_expr(&n.expression, s),
        AstKind::TSSatisfiesExpression(n) => local_expr(&n.expression, s),
        AstKind::TSNonNullExpression(n) => local_expr(&n.expression, s),
        AstKind::TSTypeAssertion(n) => local_expr(&n.expression, s),
        AstKind::ParenthesizedExpression(n) => local_expr(&n.expression, s),
        AstKind::PropertyDefinition(n) => {
            if let Some(e) = &n.value {
                local_expr(e, s);
            }
        }
        AstKind::ForInStatement(n) => local_expr(&n.right, s),
        AstKind::ForOfStatement(n) => local_expr(&n.right, s),
        AstKind::JSXOpeningElement(n) => {
            match &n.name {
                JSXElementName::Identifier(n) => s.add_local_ref(&n.name, n.span.start),
                JSXElementName::IdentifierReference(n) => s.add_local_ref(&n.name, n.span.start),
                JSXElementName::ThisExpression(n) => s.add_local_ref("this", n.span.start),
                _ => {}
            }
            for attribute in &n.attributes {
                if let JSXAttributeItem::SpreadAttribute(n) = attribute {
                    local_expr(&n.argument, s);
                }
            }
        }
        AstKind::JSXExpressionContainer(n) => {
            if let Some(e) = n.expression.as_expression() {
                local_expr(e, s);
            }
        }
        AstKind::VariableDeclarator(n) => {
            if let Some(e) = &n.init {
                local_expr(e, s);
            }
        }
        AstKind::ExpressionStatement(n) => local_expr(&n.expression, s),
        AstKind::CallExpression(n) => {
            local_expr(&n.callee, s);
            for a in &n.arguments {
                if let Some(e) = a.as_expression() {
                    local_expr(e, s);
                }
            }
        }
        AstKind::NewExpression(n) => {
            local_expr(&n.callee, s);
            for a in &n.arguments {
                if let Some(e) = a.as_expression() {
                    local_expr(e, s);
                }
            }
        }
        AstKind::StaticMemberExpression(n) => local_expr(&n.object, s),
        AstKind::ComputedMemberExpression(n) => {
            local_expr(&n.object, s);
            local_expr(&n.expression, s);
        }
        AstKind::PrivateFieldExpression(n) => local_expr(&n.object, s),
        AstKind::TaggedTemplateExpression(n) => local_expr(&n.tag, s),
        AstKind::TSImportTypeQualifiedName(n) => {
            let (root, _) = import_qualified_parts(n);
            if !s.local_import_map.contains_key(root.name.as_str()) {
                s.add_local_ref(&root.name, root.span.start);
            }
        }
        AstKind::TSQualifiedName(n) => {
            if s.type_member_exprs.contains(&(n.span.start, n.span.end)) {
                if let TSTypeName::IdentifierReference(id) = &n.left {
                    s.add_local_ref(&id.name, id.span.start);
                }
                return;
            }
            let (root, _) = qualified_parts(n);
            if let Some(id) = root {
                if !s.local_import_map.contains_key(id.name.as_str()) {
                    s.add_local_ref(&id.name, id.span.start);
                }
            }
        }
        AstKind::TSTypeReference(n) => {
            if let TSTypeName::IdentifierReference(id) = &n.type_name {
                if !s.local_import_map.contains_key(id.name.as_str()) {
                    s.add_local_ref(&id.name, id.span.start);
                }
            }
        }
        AstKind::TSTypeQuery(n) => {
            if let TSTypeQueryExprName::IdentifierReference(id) = &n.expr_name {
                if !s.local_import_map.contains_key(id.name.as_str()) {
                    s.add_local_ref(&id.name, id.span.start);
                }
            }
        }
        _ => {}
    }
}

fn augmentation_refs(body: &TSModuleBlock<'_>) -> Strings {
    let mut declared = Strings::new();
    for statement in &body.body {
        let declaration = if let Statement::ExportDeclaration(export) = statement {
            Some(&export.declaration)
        } else {
            statement.as_declaration()
        };
        if let Some(declaration) = declaration {
            match declaration {
                Declaration::VariableDeclaration(d) => {
                    for v in &d.declarations {
                        if let BindingPattern::BindingIdentifier(id) = &v.id {
                            declared.insert(id.name.to_string());
                        }
                    }
                }
                Declaration::FunctionDeclaration(d) => {
                    if let Some(id) = &d.id {
                        declared.insert(id.name.to_string());
                    }
                }
                Declaration::ClassDeclaration(d) => {
                    if let Some(id) = &d.id {
                        declared.insert(id.name.to_string());
                    }
                }
                Declaration::TSTypeAliasDeclaration(d) => {
                    declared.insert(d.id.name.to_string());
                }
                Declaration::TSInterfaceDeclaration(d) => {
                    declared.insert(d.id.name.to_string());
                }
                Declaration::TSEnumDeclaration(d) => {
                    declared.insert(d.id.name.to_string());
                }
                Declaration::TSNamespaceDeclaration(d) => {
                    declared.insert(d.id.name.to_string());
                }
                Declaration::TSImportEqualsDeclaration(d) => {
                    declared.insert(d.id.name.to_string());
                }
                _ => {}
            }
        }
    }
    struct Collector {
        declared: Strings,
        refs: Strings,
    }
    impl<'a> Visit<'a> for Collector {
        fn enter_node(&mut self, kind: AstKind<'a>) {
            let name = match kind {
                AstKind::TSTypeReference(n) => Some(&n.type_name),
                AstKind::TSInterfaceHeritage(n) => Some(&n.type_name),
                _ => None,
            };
            if let Some(TSTypeName::IdentifierReference(id)) = name {
                if !self.declared.contains(id.name.as_str()) {
                    self.refs.insert(id.name.to_string());
                }
            }
        }
    }
    let mut collector = Collector {
        declared,
        refs: Strings::new(),
    };
    for statement in &body.body {
        collector.visit_statement(statement);
    }
    collector.refs
}

pub fn finish(s: &mut State<'_, '_>) {
    exports::finish(s);
    for (name, member) in &s.member_refs_in_file {
        if let Some(export) = s.exports.get_mut(name) {
            for item in &mut export.members {
                if &item.identifier == member {
                    item.has_refs_in_file = true;
                }
            }
        }
    }
    for (name, aliases) in &s.import_aliases {
        if !s.accessed_aliases.contains(name) {
            for alias in aliases {
                if let Some(import) = s.local_import_map.get(&alias.id).filter(|i| i.is_namespace) {
                    if let Some(map) = s.internal.get_mut(&import.file_path) {
                        add_value(&mut map.import, "__opaque", s.file_path);
                    }
                }
            }
        }
    }
    for (name, properties) in &s.ns_containers {
        for (key, ns) in properties {
            if !s.accessed_ns_containers.contains(&format!("{name}.{key}")) {
                if let Some(import) = s.local_import_map.get(ns) {
                    if let Some(map) = s.internal.get_mut(&import.file_path) {
                        add_value(&mut map.import, "__opaque", s.file_path);
                    }
                }
            }
        }
    }
    if s.local_refs.is_none() {
        for name in &s.bare_expr_refs {
            if let Some(export) = s.exports.get_mut(name) {
                export.has_refs_in_file = true;
            }
        }
    }
    for name in &s.registered_custom_elements {
        if let Some(export) = s.exports.get_mut(name) {
            export.is_registered = true;
        }
        if let Some(aliases) = s.local_to_exports.get(name) {
            for alias in aliases {
                if let Some(export) = s.exports.get_mut(alias) {
                    export.is_registered = true;
                }
            }
        }
    }
    if let Some(refs) = &mut s.local_refs {
        for name in &s.imported_refs {
            if let Some(aliases) = s.local_to_exports.get(name) {
                refs.extend(aliases.iter().cloned());
            }
        }
    }
}
