# Compilers

Built-in compilers are intentionally lightweight extractors, not parsers. They
use a small number of understandable regular expressions to collect enough
imports for the module graph. They do not aim to validate the embedded language,
recover all exports, or handle every string, comment, and syntax edge case.

Keep compiler changes within that boundary. Prefer a narrow regex guard over a
full lexer or parser, and document the important cases that remain unsupported.
When parser-level fidelity matters, an actual framework compiler or parser is
the better choice; see the [Compilers documentation][1] for Svelte and Vue
examples.

Tests should cover the intended extraction and the nearby false-positive or
false-negative cases without turning the built-in compiler into a language
implementation. Test a new token inside every comment and string form the
scanner skips. Before changing a shared extractor such as `styleExtractor`,
check the tag syntax of every compiler that uses it, not only the tested ones
(Marko's `<style.less>` shorthand also goes through it).

[1]: ../packages/docs/src/content/docs/features/compilers.md
