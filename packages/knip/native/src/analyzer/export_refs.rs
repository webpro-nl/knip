use indexmap::IndexMap;
use oxc_ast::{AstKind, ast::*};
use oxc_ast_visit::{Visit, walk};
use oxc_syntax::scope::ScopeFlags;

use super::super::state::{ExportMember, State, Strings};

#[derive(Default)]
pub struct RefState<'a> {
    calls: Vec<PendingCall<'a>>,
    members: Vec<PendingMember<'a>>,
    chains: Vec<Strings>,
}

struct PendingCall<'a> {
    name: &'a str,
    export: String,
    chain: usize,
    callee: bool,
}

struct PendingMember<'a> {
    object: &'a str,
    property: &'a str,
    export: String,
    chain: usize,
}

struct Collector<'s, 'a, 'h> {
    state: &'s mut State<'a, 'h>,
    export: &'s str,
    signature_only: bool,
    in_body: bool,
    chain: usize,
    this_type: Option<&'s str>,
}

impl<'a> Visit<'a> for Collector<'_, 'a, '_> {
    fn visit_ts_type_query(&mut self, node: &TSTypeQuery<'a>) {
        if let TSTypeQueryExprName::IdentifierReference(id) = &node.expr_name {
            self.state.add_ref_in_export(&id.name, self.export);
        }
    }

    fn visit_ts_type_reference(&mut self, node: &TSTypeReference<'a>) {
        if let TSTypeName::IdentifierReference(id) = &node.type_name {
            self.state.add_ref_in_export(&id.name, self.export);
        }
        walk::walk_ts_type_reference(self, node);
    }

    fn visit_ts_this_type(&mut self, _: &TSThisType) {
        if let Some(name) = self.this_type {
            self.state.add_ref_in_export(name, self.export);
        }
    }

    fn visit_call_expression(&mut self, node: &CallExpression<'a>) {
        let node = self.alloc(node);
        match &node.callee {
            Expression::Identifier(id) => self.state.refs.calls.push(PendingCall {
                name: id.name.as_str(),
                export: self.export.to_owned(),
                chain: self.chain,
                callee: true,
            }),
            Expression::StaticMemberExpression(member) => {
                if let Expression::Identifier(id) = &member.object {
                    self.state.refs.members.push(PendingMember {
                        object: id.name.as_str(),
                        property: member.property.name.as_str(),
                        export: self.export.to_owned(),
                        chain: self.chain,
                    });
                }
            }
            _ => {}
        }
        if !self.in_body {
            for arg in &node.arguments {
                if let Argument::Identifier(id) = arg {
                    self.state.refs.calls.push(PendingCall {
                        name: id.name.as_str(),
                        export: self.export.to_owned(),
                        chain: self.chain,
                        callee: false,
                    });
                }
            }
        }
        walk::walk_call_expression(self, node);
    }

    fn visit_block_statement(&mut self, node: &BlockStatement<'a>) {
        if self.signature_only {
            return;
        }
        let previous = self.in_body;
        self.in_body = true;
        walk::walk_block_statement(self, node);
        self.in_body = previous;
    }

    fn visit_function_body(&mut self, node: &FunctionBody<'a>) {
        if self.signature_only {
            return;
        }
        let previous = self.in_body;
        self.in_body = true;
        walk::walk_function_body(self, node);
        self.in_body = previous;
    }

    fn visit_ts_as_expression(&mut self, node: &TSAsExpression<'a>) {
        if self.in_body {
            self.visit_expression(&node.expression);
        } else {
            walk::walk_ts_as_expression(self, node);
        }
    }

    fn visit_ts_type_assertion(&mut self, node: &TSTypeAssertion<'a>) {
        if self.in_body {
            self.visit_expression(&node.expression);
        } else {
            walk::walk_ts_type_assertion(self, node);
        }
    }

    fn visit_ts_satisfies_expression(&mut self, node: &TSSatisfiesExpression<'a>) {
        if self.in_body {
            self.visit_expression(&node.expression);
        } else {
            walk::walk_ts_satisfies_expression(self, node);
        }
    }

    fn visit_variable_declarator(&mut self, node: &VariableDeclarator<'a>) {
        if self.in_body {
            if let Some(init) = &node.init {
                self.visit_expression(init);
            }
        } else {
            walk::walk_variable_declarator(self, node);
        }
    }
}

impl<'a> Collector<'_, 'a, '_> {
    fn kind(&mut self, node: AstKind<'a>) {
        match node {
            AstKind::VariableDeclarator(node) => self.visit_variable_declarator(node),
            AstKind::Function(node) => self.visit_function(node, ScopeFlags::Function),
            AstKind::ArrowFunctionExpression(node) => self.visit_arrow_function_expression(node),
            AstKind::Class(node) => self.visit_class(node),
            AstKind::TSInterfaceBody(node) => self.visit_ts_interface_body(node),
            _ => {}
        }
    }

    fn call_result(&mut self, node: AstKind<'a>) {
        if let AstKind::VariableDeclarator(decl) = node {
            if let Some(annotation) = &decl.type_annotation {
                if let TSType::TSFunctionType(function) = &annotation.type_annotation {
                    if let Some(params) = &function.type_parameters {
                        self.visit_ts_type_parameter_declaration(params);
                    }
                    self.visit_ts_type_annotation(&function.return_type);
                } else {
                    self.visit_ts_type(&annotation.type_annotation);
                }
                return;
            }
            match &decl.init {
                Some(Expression::ArrowFunctionExpression(function)) => self.arrow_result(function),
                Some(Expression::FunctionExpression(function)) => self.function_result(function),
                _ => self.kind(node),
            }
            return;
        }
        match node {
            AstKind::ArrowFunctionExpression(function) => self.arrow_result(function),
            AstKind::Function(function) if function.r#type != FunctionType::TSDeclareFunction => {
                self.function_result(function)
            }
            _ => self.kind(node),
        }
    }

    fn function_result(&mut self, function: &'a Function<'a>) {
        if let Some(return_type) = &function.return_type {
            if let Some(params) = &function.type_parameters {
                self.visit_ts_type_parameter_declaration(params);
            }
            self.visit_ts_type_annotation(return_type);
        } else {
            self.visit_function(function, ScopeFlags::Function);
        }
    }

    fn arrow_result(&mut self, function: &'a ArrowFunctionExpression<'a>) {
        if let Some(return_type) = &function.return_type {
            if let Some(params) = &function.type_parameters {
                self.visit_ts_type_parameter_declaration(params);
            }
            self.visit_ts_type_annotation(return_type);
        } else if !self.direct_member_result(function) {
            self.visit_arrow_function_expression(function);
        }
    }

    fn direct_member_result(&mut self, function: &'a ArrowFunctionExpression<'a>) -> bool {
        let ArrowFunctionBody::StaticMemberExpression(member) = &function.body else {
            return false;
        };
        let Expression::Identifier(object) = &member.object else {
            return false;
        };
        let Some(param) = function.params.items.iter().find(|param| param.initializer.is_none() && param.accessibility.is_none() && !param.readonly && !param.r#override && matches!(&param.pattern, BindingPattern::BindingIdentifier(id) if id.name == object.name)) else { return false; };
        let Some(annotation) = &param.type_annotation else {
            return false;
        };
        let TSType::TSTypeReference(reference) = &annotation.type_annotation else {
            return false;
        };
        let TSTypeName::IdentifierReference(name) = &reference.type_name else {
            return false;
        };
        if reference.type_arguments.is_some() {
            return false;
        }
        let Some(Some(decl)) = self.state.local_interfaces.get(name.name.as_str()).copied() else {
            return false;
        };
        if decl.type_parameters.is_some() {
            return false;
        }
        let mut found = None;
        for signature in &decl.body.body {
            if let TSSignature::TSPropertySignature(property) = signature {
                if !property.computed
                    && matches!(&property.key, PropertyKey::StaticIdentifier(id) if id.name == member.property.name)
                {
                    if let Some(annotation) = &property.type_annotation {
                        if found.is_some() {
                            return false;
                        }
                        found = Some(annotation);
                    }
                }
            }
        }
        let Some(annotation) = found else {
            return false;
        };
        let previous = self.this_type;
        self.this_type = Some(name.name.as_str());
        self.visit_ts_type_annotation(annotation);
        self.this_type = previous;
        true
    }
}

fn new_chain(s: &mut State<'_, '_>) -> usize {
    let chain = s.refs.chains.len();
    s.refs.chains.push(Strings::new());
    chain
}

pub(super) fn collect<'a>(
    node: AstKind<'a>,
    export: &str,
    signature_only: bool,
    s: &mut State<'a, '_>,
) {
    let chain = new_chain(s);
    Collector {
        state: s,
        export,
        signature_only,
        in_body: false,
        chain,
        this_type: None,
    }
    .kind(node);
}

pub(super) fn collect_expression<'a>(
    node: &'a Expression<'a>,
    export: &str,
    signature_only: bool,
    s: &mut State<'a, '_>,
) {
    let chain = new_chain(s);
    Collector {
        state: s,
        export,
        signature_only,
        in_body: false,
        chain,
        this_type: None,
    }
    .visit_expression(node);
}

pub(super) fn collect_type<'a>(
    node: &'a TSType<'a>,
    export: &str,
    signature_only: bool,
    s: &mut State<'a, '_>,
) {
    let chain = new_chain(s);
    Collector {
        state: s,
        export,
        signature_only,
        in_body: false,
        chain,
        this_type: None,
    }
    .visit_ts_type(node);
}

pub fn finish(s: &mut State<'_, '_>) {
    while !s.refs.calls.is_empty() || !s.refs.members.is_empty() {
        while let Some(call) = s.refs.calls.pop() {
            let key = format!(
                "{}:{}",
                if call.callee { "callee" } else { "argument" },
                call.name
            );
            if s.refs.chains[call.chain].contains(&key) {
                continue;
            }
            let Some(decl) = s.local_declarations.get(call.name).copied() else {
                continue;
            };
            s.refs.chains[call.chain].insert(key);
            let mut collector = Collector {
                state: s,
                export: &call.export,
                signature_only: true,
                in_body: false,
                chain: call.chain,
                this_type: None,
            };
            if call.callee {
                collector.call_result(decl);
            } else {
                collector.kind(decl);
            }
        }
        while let Some(call) = s.refs.members.pop() {
            let key = format!("{}.{}", call.object, call.property);
            if s.refs.chains[call.chain].contains(&key) {
                continue;
            }
            let Some(AstKind::VariableDeclarator(decl)) =
                s.local_declarations.get(call.object).copied()
            else {
                continue;
            };
            let Some(Expression::ObjectExpression(obj)) = &decl.init else {
                continue;
            };
            let Some(prop) = obj.properties.iter().find_map(|prop| match prop {
                ObjectPropertyKind::ObjectProperty(prop)
                    if match &prop.key {
                        PropertyKey::StaticIdentifier(id) => id.name == call.property,
                        PropertyKey::Identifier(id) => id.name == call.property,
                        _ => false,
                    } =>
                {
                    Some(prop)
                }
                _ => None,
            }) else {
                continue;
            };
            let function = match &prop.value {
                Expression::ArrowFunctionExpression(function) => {
                    AstKind::ArrowFunctionExpression(function)
                }
                Expression::FunctionExpression(function) => AstKind::Function(function),
                _ => continue,
            };
            s.refs.chains[call.chain].insert(key);
            Collector {
                state: s,
                export: &call.export,
                signature_only: true,
                in_body: false,
                chain: call.chain,
                this_type: None,
            }
            .call_result(function);
        }
    }
    s.refs.chains.clear();
}

#[derive(Default)]
struct NamespaceScope {
    prefix: String,
    names: Strings,
    own: Strings,
    shadow: bool,
}

struct NamespaceRefs<'m> {
    members: &'m mut [ExportMember],
    by_identifier: IndexMap<String, usize>,
    scopes: Vec<NamespaceScope>,
    pushed: Vec<bool>,
}

fn binding_names(pattern: &BindingPattern<'_>, names: &mut Strings) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            names.insert(id.name.to_string());
        }
        BindingPattern::ObjectPattern(pattern) => {
            for property in &pattern.properties {
                binding_names(&property.value, names);
            }
            if let Some(rest) = &pattern.rest {
                binding_names(&rest.argument, names);
            }
        }
        BindingPattern::ArrayPattern(pattern) => {
            for element in pattern.elements.iter().flatten() {
                binding_names(element, names);
            }
            if let Some(rest) = &pattern.rest {
                binding_names(&rest.argument, names);
            }
        }
        BindingPattern::AssignmentPattern(pattern) => binding_names(&pattern.left, names),
    }
}

fn declaration_names(decl: &Declaration<'_>, names: &mut Strings) {
    match decl {
        Declaration::VariableDeclaration(decl) => {
            for declarator in &decl.declarations {
                binding_names(&declarator.id, names);
            }
        }
        Declaration::FunctionDeclaration(decl) => {
            if let Some(id) = &decl.id {
                names.insert(id.name.to_string());
            }
        }
        Declaration::ClassDeclaration(decl) => {
            if let Some(id) = &decl.id {
                names.insert(id.name.to_string());
            }
        }
        Declaration::TSTypeAliasDeclaration(decl) => {
            names.insert(decl.id.name.to_string());
        }
        Declaration::TSInterfaceDeclaration(decl) => {
            names.insert(decl.id.name.to_string());
        }
        Declaration::TSEnumDeclaration(decl) => {
            names.insert(decl.id.name.to_string());
        }
        Declaration::TSNamespaceDeclaration(decl)
            if matches!(&decl.body, TSNamespaceDeclarationBody::TSModuleBlock(_)) =>
        {
            names.insert(decl.id.name.to_string());
        }
        Declaration::TSGlobalDeclaration(_) => {
            names.insert("global".to_owned());
        }
        Declaration::TSImportEqualsDeclaration(decl) => {
            names.insert(decl.id.name.to_string());
        }
        _ => {}
    }
}

fn declared_names(statements: &[Statement<'_>], names: &mut Strings) {
    for statement in statements {
        if let Some(decl) = statement.as_declaration() {
            declaration_names(decl, names);
        }
    }
}

fn vars_decl(decl: &VariableDeclaration<'_>, names: &mut Strings) {
    if decl.kind == VariableDeclarationKind::Var {
        for declarator in &decl.declarations {
            binding_names(&declarator.id, names);
        }
    }
}

fn var_names(statement: &Statement<'_>, names: &mut Strings) {
    match statement {
        Statement::VariableDeclaration(decl) => vars_decl(decl, names),
        Statement::BlockStatement(block) => {
            for stmt in &block.body {
                var_names(stmt, names);
            }
        }
        Statement::IfStatement(stmt) => {
            var_names(&stmt.consequent, names);
            if let Some(alternate) = &stmt.alternate {
                var_names(alternate, names);
            }
        }
        Statement::ForStatement(stmt) => {
            if let Some(ForStatementInit::VariableDeclaration(decl)) = &stmt.init {
                vars_decl(decl, names);
            }
            var_names(&stmt.body, names);
        }
        Statement::ForInStatement(stmt) => {
            if let ForStatementLeft::VariableDeclaration(decl) = &stmt.left {
                vars_decl(decl, names);
            }
            var_names(&stmt.body, names);
        }
        Statement::ForOfStatement(stmt) => {
            if let ForStatementLeft::VariableDeclaration(decl) = &stmt.left {
                vars_decl(decl, names);
            }
            var_names(&stmt.body, names);
        }
        Statement::WhileStatement(stmt) => var_names(&stmt.body, names),
        Statement::DoWhileStatement(stmt) => var_names(&stmt.body, names),
        Statement::LabeledStatement(stmt) => var_names(&stmt.body, names),
        Statement::TryStatement(stmt) => {
            for child in &stmt.block.body {
                var_names(child, names);
            }
            if let Some(handler) = &stmt.handler {
                for child in &handler.body.body {
                    var_names(child, names);
                }
            }
            if let Some(finalizer) = &stmt.finalizer {
                for child in &finalizer.body {
                    var_names(child, names);
                }
            }
        }
        Statement::SwitchStatement(stmt) => {
            for case in &stmt.cases {
                for child in &case.consequent {
                    var_names(child, names);
                }
            }
        }
        _ => {}
    }
}

fn parameter_names(params: &FormalParameters<'_>, names: &mut Strings) {
    for param in &params.items {
        binding_names(&param.pattern, names);
    }
    if let Some(rest) = &params.rest {
        binding_names(&rest.rest.argument, names);
    }
}

impl NamespaceRefs<'_> {
    fn add_ref(&mut self, name: &str, path: &[&str]) {
        for scope in self.scopes.iter().rev() {
            if !scope.names.contains(name) {
                continue;
            }
            if scope.shadow {
                return;
            }
            let mut id = if scope.prefix.is_empty() {
                name.to_owned()
            } else {
                format!("{}.{name}", scope.prefix)
            };
            for index in 0..=path.len() {
                if !scope.own.contains(&id) {
                    if let Some(index) = self.by_identifier.get(&id) {
                        self.members[*index].has_refs_in_file = true;
                    }
                }
                if let Some(segment) = path.get(index) {
                    id.push('.');
                    id.push_str(segment);
                }
            }
            return;
        }
    }

    fn set_own(&mut self, names: Strings) {
        if let Some(scope) = self.scopes.last_mut() {
            scope.own.clear();
            for name in names {
                scope.own.insert(if scope.prefix.is_empty() {
                    name
                } else {
                    format!("{}.{name}", scope.prefix)
                });
            }
        }
    }

    fn namespace<'a>(&mut self, statements: &'a [Statement<'a>], name: Option<&str>) {
        let prefix = match self.scopes.last() {
            None => String::new(),
            Some(parent) if parent.prefix.is_empty() => name.unwrap_or_default().to_owned(),
            Some(parent) => format!("{}.{}", parent.prefix, name.unwrap_or("undefined")),
        };
        let mut scope = NamespaceScope {
            prefix,
            ..NamespaceScope::default()
        };
        for statement in statements {
            let decl = match statement {
                Statement::ExportDeclaration(export) => Some(&export.declaration),
                _ => statement.as_declaration(),
            };
            if let Some(decl) = decl {
                declaration_names(decl, &mut scope.names);
            }
        }
        self.scopes.push(scope);
        for statement in statements {
            let decl = match statement {
                Statement::ExportDeclaration(export) => Some(&export.declaration),
                _ => statement.as_declaration(),
            };
            if let Some(Declaration::VariableDeclaration(decl)) = decl {
                for declarator in &decl.declarations {
                    let mut names = Strings::new();
                    binding_names(&declarator.id, &mut names);
                    self.set_own(names);
                    self.visit_variable_declarator(declarator);
                }
            } else {
                let mut names = Strings::new();
                if let Some(decl) = decl {
                    declaration_names(decl, &mut names);
                }
                self.set_own(names);
                if let Some(decl) = decl {
                    self.visit_declaration(decl);
                } else {
                    self.visit_statement(statement);
                }
            }
        }
        self.scopes.pop();
    }
}

impl<'a> Visit<'a> for NamespaceRefs<'_> {
    fn enter_node(&mut self, node: AstKind<'a>) {
        let mut names = Strings::new();
        match node {
            AstKind::BlockStatement(block) => declared_names(&block.body, &mut names),
            AstKind::FunctionBody(block) => declared_names(&block.statements, &mut names),
            AstKind::StaticBlock(block) => declared_names(&block.body, &mut names),
            AstKind::SwitchStatement(stmt) => {
                for case in &stmt.cases {
                    declared_names(&case.consequent, &mut names);
                }
            }
            AstKind::ForStatement(stmt) => {
                if let Some(ForStatementInit::VariableDeclaration(decl)) = &stmt.init {
                    for d in &decl.declarations {
                        binding_names(&d.id, &mut names);
                    }
                }
            }
            AstKind::ForInStatement(stmt) => {
                if let ForStatementLeft::VariableDeclaration(decl) = &stmt.left {
                    for d in &decl.declarations {
                        binding_names(&d.id, &mut names);
                    }
                }
            }
            AstKind::ForOfStatement(stmt) => {
                if let ForStatementLeft::VariableDeclaration(decl) = &stmt.left {
                    for d in &decl.declarations {
                        binding_names(&d.id, &mut names);
                    }
                }
            }
            AstKind::CatchClause(clause) => {
                if let Some(param) = &clause.param {
                    binding_names(&param.pattern, &mut names);
                }
            }
            AstKind::Class(class) if class.r#type == ClassType::ClassExpression => {
                if let Some(id) = &class.id {
                    names.insert(id.name.to_string());
                }
            }
            AstKind::Function(function) => {
                parameter_names(&function.params, &mut names);
                if function.r#type == FunctionType::FunctionExpression {
                    if let Some(id) = &function.id {
                        names.insert(id.name.to_string());
                    }
                }
                if let Some(body) = &function.body {
                    for statement in &body.statements {
                        var_names(statement, &mut names);
                    }
                }
            }
            AstKind::ArrowFunctionExpression(function) => {
                parameter_names(&function.params, &mut names);
                if let ArrowFunctionBody::FunctionBody(body) = &function.body {
                    for statement in &body.statements {
                        var_names(statement, &mut names);
                    }
                }
            }
            AstKind::TSFunctionType(function) => parameter_names(&function.params, &mut names),
            AstKind::TSConstructorType(function) => parameter_names(&function.params, &mut names),
            AstKind::TSCallSignatureDeclaration(function) => {
                parameter_names(&function.params, &mut names)
            }
            AstKind::TSConstructSignatureDeclaration(function) => {
                parameter_names(&function.params, &mut names)
            }
            AstKind::TSMethodSignature(function) => parameter_names(&function.params, &mut names),
            _ => {}
        }
        let pushed = !names.is_empty();
        self.pushed.push(pushed);
        if pushed {
            self.scopes.push(NamespaceScope {
                names,
                shadow: true,
                ..NamespaceScope::default()
            });
        }
    }

    fn leave_node(&mut self, _: AstKind<'a>) {
        if self.pushed.pop().unwrap_or(false) {
            self.scopes.pop();
        }
    }

    fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
        self.add_ref(&id.name, &[]);
    }

    fn visit_jsx_identifier(&mut self, id: &JSXIdentifier<'a>) {
        self.add_ref(&id.name, &[]);
    }

    fn visit_jsx_member_expression(&mut self, member: &JSXMemberExpression<'a>) {
        self.visit_jsx_member_expression_object(&member.object);
    }

    fn visit_jsx_attribute(&mut self, attribute: &JSXAttribute<'a>) {
        if let Some(value) = &attribute.value {
            self.visit_jsx_attribute_value(value);
        }
    }

    fn visit_property_key(&mut self, key: &PropertyKey<'a>) {
        if let Some(expr) = key.as_expression() {
            self.visit_expression(expr);
        }
    }

    fn visit_object_property(&mut self, prop: &ObjectProperty<'a>) {
        if prop.computed {
            self.visit_property_key(&prop.key);
        }
        self.visit_expression(&prop.value);
    }

    fn visit_binding_property(&mut self, prop: &BindingProperty<'a>) {
        if prop.computed {
            self.visit_property_key(&prop.key);
        }
        self.visit_binding_pattern(&prop.value);
    }

    fn visit_ts_namespace_declaration(&mut self, node: &TSNamespaceDeclaration<'a>) {
        let name = matches!(&node.body, TSNamespaceDeclarationBody::TSModuleBlock(_))
            .then_some(node.id.name.as_str());
        let mut body = &node.body;
        loop {
            match body {
                TSNamespaceDeclarationBody::TSModuleBlock(body) => {
                    self.namespace(&body.body, name);
                    break;
                }
                TSNamespaceDeclarationBody::TSNamespaceDeclaration(nested) => body = &nested.body,
            }
        }
    }

    fn visit_ts_external_module_declaration(&mut self, node: &TSExternalModuleDeclaration<'a>) {
        if let Some(body) = &node.body {
            self.namespace(&body.body, None);
        }
    }

    fn visit_ts_global_declaration(&mut self, node: &TSGlobalDeclaration<'a>) {
        self.namespace(&node.body.body, Some("global"));
    }

    fn visit_static_member_expression(&mut self, member: &StaticMemberExpression<'a>) {
        let mut path = vec![member.property.name.as_str()];
        let mut object = &member.object;
        while let Expression::StaticMemberExpression(member) = object {
            path.push(member.property.name.as_str());
            object = &member.object;
        }
        path.reverse();
        if let Expression::Identifier(id) = object {
            self.add_ref(&id.name, &path);
        } else {
            self.visit_expression(object);
        }
    }

    fn visit_ts_import_type_qualifier(&mut self, qualifier: &TSImportTypeQualifier<'a>) {
        let mut path = Vec::new();
        let mut object = qualifier;
        while let TSImportTypeQualifier::QualifiedName(qualified) = object {
            path.push(qualified.right.name.as_str());
            object = &qualified.left;
        }
        path.reverse();
        if let TSImportTypeQualifier::Identifier(id) = object {
            self.add_ref(&id.name, &path);
        }
    }

    fn visit_ts_qualified_name(&mut self, qualified: &TSQualifiedName<'a>) {
        let mut path = vec![qualified.right.name.as_str()];
        let mut object = &qualified.left;
        while let TSTypeName::QualifiedName(qualified) = object {
            path.push(qualified.right.name.as_str());
            object = &qualified.left;
        }
        path.reverse();
        if let TSTypeName::IdentifierReference(id) = object {
            self.add_ref(&id.name, &path);
        } else {
            self.visit_ts_type_name(object);
        }
    }
}

pub(super) fn mark_namespace_refs<'a>(body: &'a [Statement<'a>], members: &mut [ExportMember]) {
    let mut by_identifier = IndexMap::new();
    for (index, member) in members.iter().enumerate() {
        by_identifier.insert(member.identifier.clone(), index);
    }
    NamespaceRefs {
        members,
        by_identifier,
        scopes: vec![],
        pushed: vec![],
    }
    .namespace(body, None);
}
