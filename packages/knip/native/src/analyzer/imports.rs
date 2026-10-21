use oxc_ast::{AstKind, ast::*};
use oxc_span::GetSpan;

use super::common::{
    argument_string, property_name, safe_script_from_args, script_from_arg, string_value,
};
use super::state::{
    DYNAMIC, ENTRY, LOADER, LocalImport, OPAQUE, OPTIONAL, SIDE_EFFECTS, State, Tags, add_value,
    in_node_modules,
};

pub fn enter<'a>(kind: AstKind<'a>, s: &mut State<'a, '_>) {
    match kind {
        AstKind::VariableDeclarator(node) => {
            variable(node, s);
            track_registry(node, s);
        }
        AstKind::ImportExpression(node) => {
            if !s.handled_import_expressions.contains(&node.span.start) {
                if let Some(specifier) = string_value(&node.source).filter(|v| !v.is_empty()) {
                    s.add_import(
                        &specifier,
                        None,
                        None,
                        None,
                        node.source.span().start,
                        DYNAMIC | OPAQUE,
                        None,
                        None,
                        None,
                    );
                }
            }
        }
        AstKind::CallExpression(node) => call(node, s),
        AstKind::NewExpression(node) => new_expression(node, s),
        _ => {}
    }
}

pub(super) fn named_member<'n, 'a>(
    expression: &'n Expression<'a>,
) -> Option<(&'n Expression<'a>, &'n str)> {
    match expression {
        Expression::StaticMemberExpression(member) => {
            Some((&member.object, member.property.name.as_str()))
        }
        Expression::PrivateFieldExpression(member) => {
            Some((&member.object, member.field.name.as_str()))
        }
        _ => None,
    }
}

fn meta_url(argument: &Argument<'_>) -> bool {
    argument
        .as_expression()
        .and_then(named_member)
        .is_some_and(|(object, name)| {
            name == "url" && matches!(object, Expression::ImportMeta(_) | Expression::NewTarget(_))
        })
}

fn dynamic_namespace(s: &mut State<'_, '_>, specifier: &str, name: &str) {
    let resolved = s.resolve_module(specifier);
    if resolved.kind != "resolved" || resolved.is_external_library_import == Some(true) {
        return;
    }
    if let Some(path) = resolved
        .resolved_file_name
        .filter(|path| !in_node_modules(path))
    {
        s.local_import_map.insert(
            name.to_owned(),
            LocalImport {
                imported_name: "*".to_owned(),
                file_path: path,
                is_namespace: true,
                is_dynamic_import: true,
            },
        );
    }
}

fn binding_imports(
    pattern: &ObjectPattern<'_>,
    specifier: &str,
    flags: u32,
    tags: Option<Tags>,
    s: &mut State<'_, '_>,
) {
    for prop in &pattern.properties {
        let imported = imported_name(&prop.key);
        let local = match &prop.value {
            BindingPattern::BindingIdentifier(id) => Some(id.name.as_str()),
            _ => imported.as_deref(),
        };
        let alias = local.filter(|name| Some(*name) != imported.as_deref());
        s.add_import(
            specifier,
            imported.as_deref(),
            alias,
            None,
            prop.key.span().start,
            flags,
            None,
            tags.clone(),
            None,
        );
    }
    if let Some(rest) = &pattern.rest {
        if let BindingPattern::BindingIdentifier(id) = &rest.argument {
            s.add_import(
                specifier,
                Some("*"),
                Some(&id.name),
                None,
                rest.span.start,
                flags,
                None,
                tags,
                None,
            );
        }
    }
}

fn imported_name(key: &PropertyKey<'_>) -> Option<String> {
    property_name(key).or_else(|| match key {
        PropertyKey::Identifier(id) => Some(id.name.to_string()),
        _ => None,
    })
}

fn identifier_key<'n>(key: &'n PropertyKey<'_>) -> Option<&'n str> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.as_str()),
        PropertyKey::Identifier(id) => Some(id.name.as_str()),
        _ => None,
    }
}

fn variable(node: &VariableDeclarator<'_>, s: &mut State<'_, '_>) {
    let Some(init) = &node.init else {
        return;
    };
    let import = match init {
        Expression::ImportExpression(import) => Some(import.as_ref()),
        Expression::AwaitExpression(awaited) => match &awaited.argument {
            Expression::ImportExpression(import) => Some(import.as_ref()),
            _ => None,
        },
        _ => None,
    };
    if let Some(import) = import {
        if let Some(specifier) = string_value(&import.source) {
            s.handled_import_expressions.insert(import.span.start);
            match &node.id {
                BindingPattern::ObjectPattern(pattern) => {
                    binding_imports(pattern, &specifier, DYNAMIC, None, s)
                }
                BindingPattern::BindingIdentifier(id)
                    if matches!(init, Expression::AwaitExpression(_)) =>
                {
                    s.add_import(
                        &specifier,
                        Some("default"),
                        Some(&id.name),
                        None,
                        import.source.span().start,
                        DYNAMIC,
                        None,
                        None,
                        None,
                    );
                    dynamic_namespace(s, &specifier, &id.name);
                }
                _ => {
                    s.add_import(
                        &specifier,
                        None,
                        None,
                        None,
                        import.source.span().start,
                        DYNAMIC | OPAQUE,
                        None,
                        None,
                        None,
                    );
                }
            }
            return;
        }
    }
    if let Expression::CallExpression(call) = init {
        if matches!(&call.callee, Expression::Identifier(id) if id.name == "require")
            && call.arguments.len() == 1
        {
            if let Some(specifier) = argument_string(&call.arguments[0]) {
                let tags = s.current_var_decl_start.map(|start| s.get_tags(start));
                match &node.id {
                    BindingPattern::ObjectPattern(pattern) => {
                        binding_imports(pattern, &specifier, 0, tags, s)
                    }
                    BindingPattern::BindingIdentifier(id) => {
                        s.add_import(
                            &specifier,
                            Some("default"),
                            Some(&id.name),
                            None,
                            call.arguments[0].span().start,
                            0,
                            None,
                            tags,
                            None,
                        );
                    }
                    _ => {
                        s.add_import(
                            &specifier,
                            None,
                            None,
                            None,
                            call.arguments[0].span().start,
                            SIDE_EFFECTS,
                            None,
                            tags,
                            None,
                        );
                    }
                }
                return;
            }
        }
    }
    if let (Expression::AwaitExpression(awaited), BindingPattern::ArrayPattern(bindings)) =
        (init, &node.id)
    {
        if let Expression::CallExpression(call) = &awaited.argument {
            if named_member(&call.callee).is_some_and(|(object, name)| {
                name == "all"
                    && matches!(object, Expression::Identifier(id) if id.name == "Promise")
            }) {
                if let Some(Argument::ArrayExpression(imports)) = call.arguments.first() {
                    for (index, element) in imports.elements.iter().enumerate() {
                        if matches!(element, ArrayExpressionElement::SpreadElement(_)) {
                            break;
                        }
                        let ArrayExpressionElement::ImportExpression(import) = element else {
                            continue;
                        };
                        let Some(specifier) = string_value(&import.source) else {
                            continue;
                        };
                        s.handled_import_expressions.insert(import.span.start);
                        match bindings.elements.get(index).and_then(Option::as_ref) {
                            Some(BindingPattern::ObjectPattern(pattern)) => {
                                for prop in &pattern.properties {
                                    let imported = imported_name(&prop.key);
                                    s.add_import(
                                        &specifier,
                                        imported.as_deref(),
                                        None,
                                        None,
                                        prop.key.span().start,
                                        0,
                                        None,
                                        None,
                                        None,
                                    );
                                }
                            }
                            Some(BindingPattern::BindingIdentifier(id)) => {
                                s.add_import(
                                    &specifier,
                                    Some("default"),
                                    Some(&id.name),
                                    None,
                                    import.source.span().start,
                                    DYNAMIC,
                                    None,
                                    None,
                                    None,
                                );
                                dynamic_namespace(s, &specifier, &id.name);
                            }
                            _ => {
                                s.add_import(
                                    &specifier,
                                    None,
                                    None,
                                    None,
                                    import.source.span().start,
                                    DYNAMIC | SIDE_EFFECTS,
                                    None,
                                    None,
                                    None,
                                );
                            }
                        }
                    }
                }
            }
        }
    }
    if let BindingPattern::BindingIdentifier(id) = &node.id {
        if let Expression::ConditionalExpression(conditional) = init {
            register_alias(&id.name, &conditional.consequent, s);
            register_alias(&id.name, &conditional.alternate, s);
        } else if matches!(init, Expression::Identifier(_)) {
            register_alias(&id.name, init, s);
        }
        if let Expression::ObjectExpression(object) = init {
            for prop in &object.properties {
                match prop {
                    ObjectPropertyKind::SpreadProperty(spread) => {
                        register_alias(&id.name, &spread.argument, s)
                    }
                    ObjectPropertyKind::ObjectProperty(prop) if !prop.computed => {
                        if let (PropertyKey::StaticIdentifier(key), Expression::Identifier(value)) =
                            (&prop.key, &prop.value)
                        {
                            if let Some(import) = s
                                .local_import_map
                                .get(value.name.as_str())
                                .filter(|i| i.is_namespace)
                            {
                                if let Some(internal) = s.internal.get_mut(&import.file_path) {
                                    internal.refs.insert(value.name.to_string());
                                }
                                s.ns_containers
                                    .entry(id.name.to_string())
                                    .or_default()
                                    .insert(key.name.to_string(), value.name.to_string());
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    if let BindingPattern::ObjectPattern(pattern) = &node.id {
        let mut root = init;
        let mut path = Vec::new();
        while let Expression::StaticMemberExpression(member) = root {
            path.push(member.property.name.as_str());
            root = &member.object;
        }
        if let Expression::Identifier(id) = root {
            if let Some(import) = s.local_import_map.get(id.name.as_str()) {
                if let Some(internal) = s.internal.get_mut(&import.file_path) {
                    if import.is_dynamic_import && path.is_empty() {
                        for prop in &pattern.properties {
                            if let Some(key) = identifier_key(&prop.key) {
                                add_value(&mut internal.import, key, s.file_path);
                            }
                        }
                        if pattern.rest.is_some() {
                            add_value(&mut internal.import, "__opaque", s.file_path);
                        }
                    } else if !import.is_dynamic_import {
                        let mut prefix = if import.is_namespace {
                            id.name.to_string()
                        } else {
                            import.imported_name.clone()
                        };
                        for part in path.iter().rev() {
                            prefix.push('.');
                            prefix.push_str(part);
                        }
                        for prop in &pattern.properties {
                            if let Some(key) = identifier_key(&prop.key) {
                                internal.refs.insert(format!("{prefix}.{key}"));
                            }
                        }
                        if pattern.rest.is_some() && import.is_namespace && path.is_empty() {
                            add_value(&mut internal.import, "__opaque", s.file_path);
                        }
                    }
                }
            }
        }
        for prop in &pattern.properties {
            let BindingPattern::AssignmentPattern(assignment) = &prop.value else {
                continue;
            };
            let Expression::Identifier(value) = &assignment.right else {
                continue;
            };
            let Some(import) = s.local_import_map.get(value.name.as_str()).cloned() else {
                continue;
            };
            if let Some(internal) = s.internal.get_mut(&import.file_path) {
                if import.is_namespace {
                    add_value(&mut internal.import, "__opaque", s.file_path);
                } else {
                    internal.refs.insert(value.name.to_string());
                }
            }
            if let BindingPattern::BindingIdentifier(local) = &assignment.left {
                s.add_import_alias(&local.name, &value.name, &import.file_path);
            }
        }
    }
}

fn register_alias(alias: &str, expression: &Expression<'_>, s: &mut State<'_, '_>) {
    let Expression::Identifier(id) = expression else {
        return;
    };
    let Some(import) = s.local_import_map.get(id.name.as_str()).cloned() else {
        return;
    };
    s.add_import_alias(alias, &id.name, &import.file_path);
    if import.is_namespace {
        if let Some(internal) = s.internal.get_mut(&import.file_path) {
            internal.refs.insert(id.name.to_string());
        }
    }
}

fn track_registry(node: &VariableDeclarator<'_>, s: &mut State<'_, '_>) {
    let BindingPattern::BindingIdentifier(id) = &node.id else {
        return;
    };
    let Some(init) = &node.init else {
        return;
    };
    let registry = match init {
        Expression::Identifier(value) => {
            value.name == "customElements" && !s.is_shadowed("customElements", value.span.start)
        }
        Expression::StaticMemberExpression(member) => member.property.name == "customElements",
        Expression::NewExpression(new) => {
            matches!(&new.callee, Expression::Identifier(id) if id.name == "CustomElementRegistry")
        }
        _ => false,
    };
    if registry {
        s.custom_element_registries.insert(id.name.to_string());
    }
}

fn registered_element(node: &CallExpression<'_>, s: &State<'_, '_>) -> Option<String> {
    let Expression::StaticMemberExpression(member) = &node.callee else {
        return None;
    };
    if member.property.name != "define" {
        return None;
    }
    let registry = match &member.object {
        Expression::Identifier(id) => {
            (id.name == "customElements" || s.custom_element_registries.contains(id.name.as_str()))
                && !s.is_shadowed(&id.name, id.span.start)
        }
        Expression::StaticMemberExpression(member) => member.property.name == "customElements",
        _ => false,
    };
    if !registry {
        return None;
    }
    match node.arguments.get(1) {
        Some(Argument::Identifier(id)) if !s.is_shadowed(&id.name, id.span.start) => {
            Some(id.name.to_string())
        }
        Some(Argument::ThisExpression(_)) if s.static_block_depth > 0 => s
            .class_name_stack
            .last()
            .filter(|name| !name.is_empty())
            .cloned(),
        _ => None,
    }
}

fn inline_dirname(argument: &Argument<'_>, s: &State<'_, '_>) -> Option<String> {
    let Argument::CallExpression(call) = argument else {
        return None;
    };
    let helper = match &call.callee {
        Expression::StaticMemberExpression(member) => {
            matches!(&member.object, Expression::Identifier(id) if id.name == "path")
                && matches!(member.property.name.as_str(), "join" | "resolve")
        }
        Expression::Identifier(id) => {
            (id.name == "join" && s.has_path_join_import)
                || (id.name == "resolve" && s.has_path_resolve_import)
        }
        _ => false,
    };
    if !helper
        || call.arguments.len() < 2
        || !matches!(&call.arguments[0], Argument::Identifier(id) if id.name == "__dirname")
    {
        return None;
    }
    let mut joined = String::new();
    for (index, arg) in call.arguments[1..].iter().enumerate() {
        if index > 0 {
            joined.push('/');
        }
        joined.push_str(&argument_string(arg)?);
    }
    let mut normalized = String::with_capacity(joined.len());
    let mut slash = false;
    for ch in joined.chars() {
        if ch != '/' || !slash {
            normalized.push(ch);
        }
        slash = ch == '/';
    }
    if !normalized.starts_with('.') && !normalized.starts_with('/') {
        normalized.insert_str(0, "./");
    }
    Some(normalized)
}

fn call(node: &CallExpression<'_>, s: &mut State<'_, '_>) {
    if node.arguments.len() >= 2 {
        if let Some(registered) = registered_element(node, s) {
            s.registered_custom_elements.insert(registered);
            return;
        }
    }
    if let Some(arg) = node.arguments.first() {
        if let Some(specifier) = argument_string(arg) {
            if matches!(&node.callee, Expression::Identifier(id) if id.name == "require")
                && node.arguments.len() == 1
            {
                let tags = s.current_var_decl_start.map(|start| s.get_tags(start));
                s.add_import(
                    &specifier,
                    Some("default"),
                    None,
                    None,
                    arg.span().start,
                    0,
                    None,
                    tags,
                    None,
                );
                return;
            }
            if named_member(&node.callee).is_some_and(|(object, name)| {
                name == "resolve"
                    && (matches!(object, Expression::Identifier(id) if id.name == "require")
                        || matches!(object, Expression::ImportMeta(_) | Expression::NewTarget(_)))
            }) {
                s.add_import(
                    &specifier,
                    None,
                    None,
                    None,
                    arg.span().start,
                    ENTRY,
                    None,
                    None,
                    None,
                );
                return;
            }
            let register = match &node.callee {
                Expression::Identifier(id) => id.name == "register",
                callee => named_member(callee).is_some_and(|(object, name)| {
                    name == "register"
                        && matches!(object, Expression::Identifier(id) if id.name == "module")
                }),
            };
            if s.has_node_module_import
                && register
                && !specifier.is_empty()
                && (!specifier.starts_with('.') || node.arguments.get(1).is_some_and(meta_url))
            {
                s.add_import(
                    &specifier,
                    None,
                    None,
                    None,
                    arg.span().start,
                    ENTRY,
                    None,
                    None,
                    None,
                );
                return;
            }
        }
        if s.has_child_process_import {
            let method = match &node.callee {
                Expression::Identifier(id) => s
                    .child_process_methods
                    .get(id.name.as_str())
                    .map(String::as_str),
                Expression::StaticMemberExpression(member) if matches!(&member.object, Expression::Identifier(id) if s.child_process_namespaces.contains(id.name.as_str())) => {
                    Some(member.property.name.as_str())
                }
                _ => None,
            };
            if let Some(method) = method {
                if matches!(method, "exec" | "execSync") {
                    if let Some(script) = script_from_arg(arg).filter(|v| !v.is_empty()) {
                        s.scripts.insert(script);
                    }
                    return;
                }
                if matches!(
                    method,
                    "fork" | "spawn" | "spawnSync" | "execFile" | "execFileSync"
                ) {
                    if let Some(specifier) = inline_dirname(arg, s).filter(|v| !v.is_empty()) {
                        s.add_import(
                            &specifier,
                            None,
                            None,
                            None,
                            arg.span().start,
                            ENTRY,
                            None,
                            None,
                            None,
                        );
                        return;
                    }
                    if method != "fork" {
                        if let Some(script) = safe_script_from_args(arg, node.arguments.get(1)) {
                            s.scripts.insert(script);
                            return;
                        }
                    }
                }
            }
        }
    }
    if matches!(&node.callee, Expression::StaticMemberExpression(member) if matches!(&member.object, Expression::Identifier(id) if id.name == "Object") && matches!(member.property.name.as_str(), "keys" | "values" | "entries" | "getOwnPropertyNames"))
    {
        for arg in &node.arguments {
            if let Argument::Identifier(id) = arg {
                if let Some(import) = s.local_import_map.get(id.name.as_str()) {
                    if let Some(internal) = s.internal.get_mut(&import.file_path) {
                        if import.is_namespace {
                            add_value(&mut internal.import, "__opaque", s.file_path);
                        } else {
                            internal.refs.insert(id.name.to_string());
                            internal
                                .enumerated
                                .get_or_insert_default()
                                .insert(import.imported_name.clone());
                        }
                    }
                }
            }
        }
        return;
    }
    for arg in &node.arguments {
        match arg {
            Argument::Identifier(id) => mark_namespace(&id.name, s),
            Argument::ArrowFunctionExpression(arrow) => {
                if let Some(mut body) = arrow.body.as_expression() {
                    if let Expression::AwaitExpression(awaited) = body {
                        body = &awaited.argument;
                    }
                    if let Expression::ImportExpression(import) = body {
                        if let Some(specifier) = string_value(&import.source) {
                            s.handled_import_expressions.insert(import.span.start);
                            s.add_import(
                                &specifier,
                                None,
                                None,
                                None,
                                import.source.span().start,
                                DYNAMIC | LOADER,
                                None,
                                None,
                                None,
                            );
                        }
                    }
                }
            }
            Argument::ArrayExpression(array) => {
                for element in &array.elements {
                    if let ArrayExpressionElement::Identifier(id) = element {
                        mark_namespace(&id.name, s);
                    }
                }
            }
            Argument::ObjectExpression(object) => {
                for prop in &object.properties {
                    let expression = match prop {
                        ObjectPropertyKind::ObjectProperty(prop) if !prop.computed => {
                            Some(&prop.value)
                        }
                        ObjectPropertyKind::SpreadProperty(spread) => Some(&spread.argument),
                        _ => None,
                    };
                    if let Some(Expression::Identifier(id)) = expression {
                        mark_namespace(&id.name, s);
                    }
                }
            }
            _ => {}
        }
    }
}

fn mark_namespace(name: &str, s: &mut State<'_, '_>) {
    if let Some(import) = s.local_import_map.get(name).filter(|i| i.is_namespace) {
        if let Some(internal) = s.internal.get_mut(&import.file_path) {
            internal.refs.insert(name.to_owned());
        }
    }
}

fn new_expression(node: &NewExpression<'_>, s: &mut State<'_, '_>) {
    if matches!(&node.callee, Expression::Identifier(id) if id.name == "URL")
        && node.arguments.len() >= 2
        && meta_url(&node.arguments[1])
    {
        if let Some(specifier) = argument_string(&node.arguments[0]) {
            if !specifier.is_empty() {
                let tags = s.get_tags(node.span.start);
                s.add_import(
                    &specifier,
                    None,
                    None,
                    None,
                    node.arguments[0].span().start,
                    ENTRY | OPTIONAL,
                    None,
                    Some(tags),
                    None,
                );
            }
            return;
        }
    }
    if s.has_worker_threads_import
        && matches!(&node.callee, Expression::Identifier(id) if id.name == "Worker")
    {
        if let Some(arg) = node.arguments.first() {
            if let Some(specifier) = inline_dirname(arg, s).filter(|v| !v.is_empty()) {
                s.add_import(
                    &specifier,
                    None,
                    None,
                    None,
                    arg.span().start,
                    ENTRY,
                    None,
                    None,
                    None,
                );
            }
        }
    }
}
