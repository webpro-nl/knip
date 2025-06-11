import type { JSONSchemaObject, Plugin } from "./types/index.js";
export interface DereferenceOptions {
    /**
     * Determines whether circular `$ref` pointers are handled.
     *
     * If set to `false`, then a `ReferenceError` will be thrown if the schema contains any circular references.
     *
     * If set to `"ignore"`, then circular references will simply be ignored. No error will be thrown, but the `$Refs.circular` property will still be set to `true`.
     */
    circular?: boolean | "ignore";
    /**
     * A function, called for each path, which can return true to stop this path and all
     * subpaths from being dereferenced further. This is useful in schemas where some
     * subpaths contain literal $ref keys that should not be dereferenced.
     */
    excludedPathMatcher?(path: string): boolean;
    /**
     * Callback invoked during dereferencing.
     *
     * @argument {string} path - The path being dereferenced (ie. the `$ref` string)
     * @argument {JSONSchemaObject} value - The JSON-Schema that the `$ref` resolved to
     * @argument {JSONSchemaObject} parent - The parent of the dereferenced object
     * @argument {string} parentPropName - The prop name of the parent object whose value was dereferenced
     */
    onDereference?(path: string, value: JSONSchemaObject, parent?: JSONSchemaObject, parentPropName?: string): void;
}
/**
 * Options that determine how JSON schemas are parsed, resolved, and dereferenced.
 *
 * @param [options] - Overridden options
 * @class
 */
export interface $RefParserOptions {
    /**
     * The `dereference` options control how JSON Schema `$Ref` Parser will dereference `$ref` pointers within the JSON schema.
     */
    dereference: DereferenceOptions;
    /**
     * The `parse` options determine how different types of files will be parsed.
     *
     * JSON Schema `$Ref` Parser comes with built-in JSON, YAML, plain-text, and binary parsers, any of which you can configure or disable. You can also add your own custom parsers if you want.
     */
    parse: {
        binary: Plugin;
        json: Plugin;
        text: Plugin;
        yaml: Plugin;
    };
    /**
     * The maximum amount of time (in milliseconds) that JSON Schema $Ref Parser will spend dereferencing a single schema.
     * It will throw a timeout error if the operation takes longer than this.
     */
    timeoutMs?: number;
}
export declare const getJsonSchemaRefParserDefaultOptions: () => $RefParserOptions;
export type Options = $RefParserOptions;
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type ParserOptions = DeepPartial<$RefParserOptions>;
export {};
