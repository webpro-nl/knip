import type { $RefParser } from "../index.js";
import type { JSONSchema } from "../types/index.js";
export type JSONParserErrorType = "EUNKNOWN" | "EPARSER" | "EUNMATCHEDPARSER" | "ETIMEOUT" | "ERESOLVER" | "EUNMATCHEDRESOLVER" | "EMISSINGPOINTER" | "EINVALIDPOINTER";
export declare class JSONParserError extends Error {
    readonly name: string;
    readonly message: string;
    source: string | undefined;
    path: Array<string | number> | null;
    readonly code: JSONParserErrorType;
    constructor(message: string, source?: string);
    get footprint(): string;
}
export declare class JSONParserErrorGroup<S extends object = JSONSchema> extends Error {
    files: $RefParser;
    constructor(parser: $RefParser);
    static getParserErrors<S extends object = JSONSchema>(parser: $RefParser): JSONParserError[];
    get errors(): Array<JSONParserError | InvalidPointerError | ResolverError | ParserError | MissingPointerError | UnmatchedParserError | UnmatchedResolverError>;
}
export declare class ParserError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    constructor(message: any, source: any);
}
export declare class UnmatchedParserError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    constructor(source: string);
}
export declare class ResolverError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    ioErrorCode?: string;
    constructor(ex: Error | any, source?: string);
}
export declare class UnmatchedResolverError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    constructor(source: any);
}
export declare class MissingPointerError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    constructor(token: string, path: string);
}
export declare class TimeoutError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    constructor(timeout: number);
}
export declare class InvalidPointerError extends JSONParserError {
    code: JSONParserErrorType;
    name: string;
    constructor(pointer: string, path: string);
}
export declare function isHandledError(err: any): err is JSONParserError;
export declare function normalizeError(err: any): any;
