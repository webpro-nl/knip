use napi::bindgen_prelude::Utf16String;
use oxc_ast::ast::*;

pub fn encode_literal(value: &str, lone_surrogates: bool) -> String {
    if !lone_surrogates && !value.contains('\0') {
        return value.to_owned();
    }
    let mut chars = value.chars();
    let mut output = String::with_capacity(value.len());
    while let Some(ch) = chars.next() {
        if ch == '\0' {
            output.push_str("\0N");
        } else if ch == '\u{fffd}' && lone_surrogates {
            output.push_str("\0S");
            for _ in 0..4 {
                if let Some(ch) = chars.next() {
                    output.push(ch);
                }
            }
        } else {
            output.push(ch);
        }
    }
    output
}

pub fn utf16(value: &str) -> Utf16String {
    decode_utf16(value).into()
}

pub fn decode_utf16(value: &str) -> Vec<u16> {
    if !value.contains('\0') {
        return value.encode_utf16().collect();
    }
    let mut chars = value.chars();
    let mut output = Vec::with_capacity(value.len());
    while let Some(ch) = chars.next() {
        if ch == '\0' {
            match chars.next() {
                Some('N') => output.push(0),
                Some('S') => {
                    let mut unit = 0;
                    for _ in 0..4 {
                        unit = (unit << 4)
                            | chars.next().and_then(|c| c.to_digit(16)).unwrap_or(0) as u16;
                    }
                    output.push(unit);
                }
                Some(next) => {
                    output.push(0);
                    output.extend(next.encode_utf16(&mut [0; 2]).iter().copied());
                }
                None => output.push(0),
            }
        } else {
            output.extend(ch.encode_utf16(&mut [0; 2]).iter().copied());
        }
    }
    output
}

pub fn string_value(expression: &Expression<'_>) -> Option<String> {
    match expression {
        Expression::StringLiteral(literal) => {
            Some(encode_literal(&literal.value, literal.lone_surrogates))
        }
        Expression::TemplateLiteral(template)
            if template.quasis.len() == 1 && template.expressions.is_empty() =>
        {
            let element = &template.quasis[0];
            Some(encode_literal(
                &element.value.cooked.unwrap_or(element.value.raw),
                element.value.cooked.is_some() && element.lone_surrogates,
            ))
        }
        _ => None,
    }
}
pub fn argument_string(argument: &Argument<'_>) -> Option<String> {
    argument.as_expression().and_then(string_value)
}
pub fn property_name(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        PropertyKey::StringLiteral(literal) => {
            Some(encode_literal(&literal.value, literal.lone_surrogates))
        }
        _ => None,
    }
}
pub fn script_from_template(template: &TemplateLiteral<'_>) -> String {
    let mut result = String::new();
    for (index, quasi) in template.quasis.iter().enumerate() {
        if index > 0 {
            result.push_str("$__knip__");
        }
        result.push_str(&encode_literal(&quasi.value.raw, false));
    }
    result
}
pub fn script_from_arg(argument: &Argument<'_>) -> Option<String> {
    argument_string(argument).or_else(|| match argument {
        Argument::TemplateLiteral(template) => Some(script_from_template(template)),
        _ => None,
    })
}
pub fn safe_script_from_args(
    executable: &Argument<'_>,
    arguments: Option<&Argument<'_>>,
) -> Option<String> {
    fn safe(value: &str) -> bool {
        !value.is_empty()
            && value
                .bytes()
                .all(|ch| ch.is_ascii_alphanumeric() || b"_@.,:/=+~-".contains(&ch))
    }
    let mut result = argument_string(executable)?;
    if !safe(&result) {
        return None;
    }
    if let Some(Argument::ArrayExpression(array)) = arguments {
        for element in &array.elements {
            if let Some(value) = element
                .as_expression()
                .and_then(string_value)
                .filter(|s| safe(s))
            {
                result.push(' ');
                result.push_str(&value);
            }
        }
    }
    Some(result)
}
pub fn resolve_path(
    file_path: &str,
    specifier: &str,
    options: &super::state::AnalyzerOptions,
) -> String {
    let style = crate::resolver::path::PathStyle {
        lossy: options.path_strings_lossy.unwrap_or(false),
        windows: false,
    };
    let directory = style.dirname(&utf16(file_path));
    let specifier = utf16(specifier);
    let cwd = options.cwd.as_ref().map(|s| s.to_vec()).unwrap_or_else(|| {
        std::env::current_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .encode_utf16()
            .collect()
    });
    let values = if specifier.first() == Some(&47) {
        vec![&specifier[..]]
    } else if directory.first() == Some(&47) {
        vec![directory.as_slice(), &specifier[..]]
    } else {
        vec![cwd.as_slice(), directory.as_slice(), &specifier[..]]
    };
    let mut path = style.join(&values);
    if path.len() > 1 && path.last() == Some(&47) {
        path.pop();
    }
    encode_utf16(&path)
}
pub fn encode_utf16(value: &[u16]) -> String {
    let mut output = String::with_capacity(value.len());
    for decoded in char::decode_utf16(value.iter().copied()) {
        match decoded {
            Ok('\0') => output.push_str("\0N"),
            Ok(ch) => output.push(ch),
            Err(surrogate) => {
                output.push_str(&format!("\0S{:04x}", surrogate.unpaired_surrogate()));
            }
        }
    }
    output
}
