use napi_derive::napi;

#[napi(object)]
#[derive(Debug, PartialEq, Eq)]
pub struct SourcePosition {
    pub pos: u32,
    pub line: u32,
    pub col: u32,
}

#[derive(Debug)]
struct Utf16Checkpoint {
    byte_end: u32,
    difference: u32,
}

#[derive(Debug)]
pub struct SourcePositions {
    line_starts: Vec<u32>,
    checkpoints: Vec<Utf16Checkpoint>,
}

impl SourcePositions {
    pub fn new(source: &str) -> Self {
        Self::with_original(source, None)
    }

    pub fn with_original(source: &str, original: Option<&[u16]>) -> Self {
        let mut line_starts = vec![0];
        if let Some(original) = original {
            for (index, unit) in original.iter().enumerate() {
                if *unit == 10 {
                    line_starts.push(index as u32 + 1);
                }
            }
        }
        let mut checkpoints = Vec::new();
        let mut difference = 0;
        for (index, ch) in source.char_indices() {
            if !ch.is_ascii() {
                difference += (ch.len_utf8() - ch.len_utf16()) as u32;
                checkpoints.push(Utf16Checkpoint {
                    byte_end: (index + ch.len_utf8()) as u32,
                    difference,
                });
            } else if ch == '\n' && original.is_none() {
                line_starts.push(index as u32 + 1 - difference);
            }
        }
        Self {
            line_starts,
            checkpoints,
        }
    }

    pub fn line_starts(&self) -> &[u32] {
        &self.line_starts
    }

    pub fn utf16_offset(&self, byte_offset: u32) -> u32 {
        let index = self
            .checkpoints
            .partition_point(|checkpoint| checkpoint.byte_end <= byte_offset);
        let difference = if index == 0 {
            0
        } else {
            self.checkpoints[index - 1].difference
        };
        byte_offset - difference
    }

    pub fn position(&self, byte_offset: u32) -> SourcePosition {
        let pos = self.utf16_offset(byte_offset);
        let (line, col) = get_line_and_col(&self.line_starts, pos);
        SourcePosition { pos, line, col }
    }
}

pub fn build_line_starts(source: &str) -> Vec<u32> {
    SourcePositions::new(source).line_starts
}

pub fn get_line_and_col(line_starts: &[u32], pos: u32) -> (u32, u32) {
    let index = line_starts.partition_point(|start| *start <= pos) - 1;
    (index as u32 + 1, pos - line_starts[index] + 1)
}

#[napi(object)]
pub struct NativePositions {
    pub line_starts: Vec<u32>,
    pub positions: Vec<SourcePosition>,
}

#[napi]
pub fn analyze_positions(source_text: String, byte_offsets: Vec<u32>) -> NativePositions {
    let source_positions = SourcePositions::new(&source_text);
    let mut positions = Vec::with_capacity(byte_offsets.len());
    for offset in byte_offsets {
        positions.push(source_positions.position(offset));
    }
    NativePositions {
        line_starts: source_positions.line_starts,
        positions,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_every_unicode_boundary_without_changing_lf_only_lines() {
        for source in ["", "a\n", "\r\n\r", "é中🍎\r\n𐐀z\r\u{2028}x\u{2029}\n"] {
            let positions = SourcePositions::new(source);
            let boundaries = source
                .char_indices()
                .map(|(offset, _)| offset)
                .chain([source.len()]);
            for offset in boundaries {
                let prefix = &source[..offset];
                let pos = prefix.encode_utf16().count() as u32;
                let line = prefix.bytes().filter(|byte| *byte == b'\n').count() as u32 + 1;
                let column_text = prefix.rsplit_once('\n').map_or(prefix, |(_, tail)| tail);
                let col = column_text.encode_utf16().count() as u32 + 1;
                assert_eq!(
                    positions.position(offset as u32),
                    SourcePosition { pos, line, col }
                );
            }
        }
    }

    #[test]
    fn preserves_utf16_columns_and_trailing_empty_lines() {
        let source = "a🍎\r\nb\rc\u{2028}d\n";
        assert_eq!(build_line_starts(source), [0, 5, 11]);
        assert_eq!(get_line_and_col(&build_line_starts(source), 2), (1, 3));
        assert_eq!(get_line_and_col(&build_line_starts(source), 11), (3, 1));
        assert_eq!(get_line_and_col(&build_line_starts(source), 15), (3, 5));
    }

    #[test]
    fn original_line_starts_survive_consumed_lf_units() {
        let original = [0xd800, 10, 10, 120];
        let source = crate::parse::parser_text(&original, true);
        let positions = SourcePositions::with_original(&source, Some(&original));
        assert_eq!(positions.line_starts(), [0, 2, 3]);
        assert_eq!(
            positions.position(5),
            SourcePosition {
                pos: 3,
                line: 3,
                col: 1
            }
        );
    }

    #[test]
    fn ascii_sources_need_no_conversion_checkpoints() {
        let positions = SourcePositions::new("export const value = 1;\n");
        assert!(positions.checkpoints.is_empty());
        assert_eq!(positions.utf16_offset(13), 13);
        assert_eq!(positions.line_starts(), [0, 24]);
    }
}
