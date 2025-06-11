import type { PluginResult } from "./util/plugins.js";
import type { $RefParserOptions } from "./options.js";
import type { FileInfo } from "./types/index.js";
/**
 * Prepares the file object so we can populate it with data and other values
 * when it's read and parsed. This "file object" will be passed to all
 * resolvers and parsers.
 */
export declare function newFile(path: string): FileInfo;
/**
 * Parses the given file's contents, using the configured parser plugins.
 */
export declare const parseFile: (file: FileInfo, options: $RefParserOptions) => Promise<PluginResult>;
