import type { $RefParserOptions } from "./options.js";
import type { $RefParser } from "./index.js";
/**
 * Crawls the JSON schema, finds all external JSON references, and resolves their values.
 * This method does not mutate the JSON schema. The resolved values are added to {@link $RefParser#$refs}.
 *
 * NOTE: We only care about EXTERNAL references here. INTERNAL references are only relevant when dereferencing.
 *
 * @returns
 * The promise resolves once all JSON references in the schema have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
export declare function resolveExternal(parser: $RefParser, options: $RefParserOptions): Promise<any[]>;
