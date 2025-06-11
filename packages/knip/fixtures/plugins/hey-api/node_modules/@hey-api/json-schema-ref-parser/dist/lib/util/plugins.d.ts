import type { FileInfo, JSONSchema } from "../types/index.js";
import type { Plugin } from "../types/index.js";
export interface PluginResult {
    error?: any;
    plugin: Pick<Plugin, 'handler'>;
    result?: string | Buffer | JSONSchema;
}
/**
 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
 * Each method can return a synchronous value, a Promise, or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further plugins are called.
 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
 * If ALL plugins fail, then the last error is thrown.
 */
export declare function run(plugins: Pick<Plugin, 'handler'>[], file: FileInfo): Promise<PluginResult>;
