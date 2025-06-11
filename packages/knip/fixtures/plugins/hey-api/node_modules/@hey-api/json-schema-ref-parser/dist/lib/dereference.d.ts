import type { ParserOptions } from "./options.js";
import type { $RefParser } from "./index";
export default dereference;
/**
 * Crawls the JSON schema, finds all JSON references, and dereferences them.
 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
 *
 * @param parser
 * @param options
 */
declare function dereference(parser: $RefParser, options: ParserOptions): void;
