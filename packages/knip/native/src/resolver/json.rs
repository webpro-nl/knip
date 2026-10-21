use super::path::{Text, ascii};

#[derive(Clone)]
pub enum PackageName {
    Text(Text),
    Other(String),
}

impl PackageName {
    pub fn text(&self) -> Option<&Text> {
        match self {
            Self::Text(value) => Some(value),
            _ => None,
        }
    }

    pub fn truthy(&self) -> bool {
        match self {
            Self::Text(value) => !value.is_empty(),
            Self::Other(value) => {
                value != "false" && value.parse::<f64>().map_or(true, |number| number != 0.0)
            }
        }
    }
}

fn string(value: &str) -> Option<(Text, usize)> {
    let mut chars = value.char_indices();
    if chars.next()?.1 != '"' {
        return None;
    }
    let mut result = Vec::new();
    while let Some((index, ch)) = chars.next() {
        if ch == '"' {
            return Some((result, index + 1));
        }
        if ch != '\\' {
            result.extend(ch.encode_utf16(&mut [0; 2]).iter().copied());
            continue;
        }
        let (_, escaped) = chars.next()?;
        result.push(match escaped {
            '"' => 34,
            '\\' => 92,
            '/' => 47,
            'b' => 8,
            'f' => 12,
            'n' => 10,
            'r' => 13,
            't' => 9,
            'u' => {
                let mut unit = 0;
                for _ in 0..4 {
                    unit = unit * 16 + chars.next()?.1.to_digit(16)? as u16;
                }
                unit
            }
            _ => return None,
        });
    }
    None
}

pub fn read_package_name(path: &[u16]) -> Option<PackageName> {
    let bytes = std::fs::read(String::from_utf16_lossy(path)).ok()?;
    let source = String::from_utf8_lossy(&bytes);
    let root = serde_json::from_str::<Box<serde_json::value::RawValue>>(&source).ok()?;
    let mut tail = root.get().strip_prefix('{')?.trim_start();
    let mut name = None;
    while !tail.starts_with('}') {
        let (key, end) = string(tail)?;
        tail = tail[end..].trim_start().strip_prefix(':')?.trim_start();
        let mut values = serde_json::Deserializer::from_str(tail)
            .into_iter::<Box<serde_json::value::RawValue>>();
        let value = values.next()?.ok()?;
        if key == ascii("name") {
            name = match value.get() {
                "null" => None,
                text if text.starts_with('"') => Some(PackageName::Text(string(text)?.0)),
                text => Some(PackageName::Other(text.to_owned())),
            };
        }
        tail = tail[values.byte_offset()..].trim_start();
        if let Some(next) = tail.strip_prefix(',') {
            tail = next.trim_start();
        }
    }
    name
}
