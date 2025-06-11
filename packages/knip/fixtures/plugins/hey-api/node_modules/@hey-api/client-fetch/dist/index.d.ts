type AuthToken = string | undefined;
interface Auth {
    /**
     * Which part of the request do we use to send the auth?
     *
     * @default 'header'
     */
    in?: 'header' | 'query' | 'cookie';
    /**
     * Header or query parameter name.
     *
     * @default 'Authorization'
     */
    name?: string;
    scheme?: 'basic' | 'bearer';
    type: 'apiKey' | 'http';
}
interface SerializerOptions<T> {
    /**
     * @default true
     */
    explode: boolean;
    style: T;
}
type ArrayStyle = 'form' | 'spaceDelimited' | 'pipeDelimited';
type ObjectStyle = 'form' | 'deepObject';

type QuerySerializer = (query: Record<string, unknown>) => string;
type BodySerializer = (body: any) => any;
interface QuerySerializerOptions {
    allowReserved?: boolean;
    array?: SerializerOptions<ArrayStyle>;
    object?: SerializerOptions<ObjectStyle>;
}
declare const formDataBodySerializer: {
    bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T) => FormData;
};
declare const jsonBodySerializer: {
    bodySerializer: <T>(body: T) => string;
};
declare const urlSearchParamsBodySerializer: {
    bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T) => string;
};

type Slot = 'body' | 'headers' | 'path' | 'query';
type Field = {
    in: Exclude<Slot, 'body'>;
    key: string;
    map?: string;
} | {
    in: Extract<Slot, 'body'>;
    key?: string;
    map?: string;
};
interface Fields {
    allowExtra?: Partial<Record<Slot, boolean>>;
    args?: ReadonlyArray<Field>;
}
type FieldsConfig = ReadonlyArray<Field | Fields>;
interface Params {
    body: unknown;
    headers: Record<string, unknown>;
    path: Record<string, unknown>;
    query: Record<string, unknown>;
}
declare const buildClientParams: (args: ReadonlyArray<unknown>, fields: FieldsConfig) => Params;

interface Client$1<RequestFn = never, Config = unknown, MethodFn = never, BuildUrlFn = never> {
    /**
     * Returns the final request URL.
     */
    buildUrl: BuildUrlFn;
    connect: MethodFn;
    delete: MethodFn;
    get: MethodFn;
    getConfig: () => Config;
    head: MethodFn;
    options: MethodFn;
    patch: MethodFn;
    post: MethodFn;
    put: MethodFn;
    request: RequestFn;
    setConfig: (config: Config) => Config;
    trace: MethodFn;
}
interface Config$1 {
    /**
     * Auth token or a function returning auth token. The resolved value will be
     * added to the request payload as defined by its `security` array.
     */
    auth?: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken;
    /**
     * A function for serializing request body parameter. By default,
     * {@link JSON.stringify()} will be used.
     */
    bodySerializer?: BodySerializer | null;
    /**
     * An object containing any HTTP headers that you want to pre-populate your
     * `Headers` object with.
     *
     * {@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init See more}
     */
    headers?: RequestInit['headers'] | Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined | unknown>;
    /**
     * The request method.
     *
     * {@link https://developer.mozilla.org/docs/Web/API/fetch#method See more}
     */
    method?: 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';
    /**
     * A function for serializing request query parameters. By default, arrays
     * will be exploded in form style, objects will be exploded in deepObject
     * style, and reserved characters are percent-encoded.
     *
     * This method will have no effect if the native `paramsSerializer()` Axios
     * API function is used.
     *
     * {@link https://swagger.io/docs/specification/serialization/#query View examples}
     */
    querySerializer?: QuerySerializer | QuerySerializerOptions;
    /**
     * A function transforming response data before it's returned. This is useful
     * for post-processing data, e.g. converting ISO strings into Date objects.
     */
    responseTransformer?: (data: unknown) => Promise<unknown>;
    /**
     * A function validating response data. This is useful if you want to ensure
     * the response conforms to the desired shape, so it can be safely passed to
     * the transformers and returned to the user.
     */
    responseValidator?: (data: unknown) => Promise<unknown>;
}

type ErrInterceptor<Err, Res, Req, Options> = (error: Err, response: Res, request: Req, options: Options) => Err | Promise<Err>;
type ReqInterceptor<Req, Options> = (request: Req, options: Options) => Req | Promise<Req>;
type ResInterceptor<Res, Req, Options> = (response: Res, request: Req, options: Options) => Res | Promise<Res>;
declare class Interceptors<Interceptor> {
    _fns: (Interceptor | null)[];
    constructor();
    clear(): void;
    getInterceptorIndex(id: number | Interceptor): number;
    exists(id: number | Interceptor): boolean;
    eject(id: number | Interceptor): void;
    update(id: number | Interceptor, fn: Interceptor): number | false | Interceptor;
    use(fn: Interceptor): number;
}
interface Middleware<Req, Res, Err, Options> {
    error: Pick<Interceptors<ErrInterceptor<Err, Res, Req, Options>>, 'eject' | 'use'>;
    request: Pick<Interceptors<ReqInterceptor<Req, Options>>, 'eject' | 'use'>;
    response: Pick<Interceptors<ResInterceptor<Res, Req, Options>>, 'eject' | 'use'>;
}
declare const createConfig: <T extends ClientOptions = ClientOptions>(override?: Config<Omit<ClientOptions, keyof T> & T>) => Config<Omit<ClientOptions, keyof T> & T>;

type ResponseStyle = 'data' | 'fields';
interface Config<T extends ClientOptions = ClientOptions> extends Omit<RequestInit, 'body' | 'headers' | 'method'>, Config$1 {
    /**
     * Base URL for all requests made by this client.
     */
    baseUrl?: T['baseUrl'];
    /**
     * Fetch API implementation. You can use this option to provide a custom
     * fetch instance.
     *
     * @default globalThis.fetch
     */
    fetch?: (request: Request) => ReturnType<typeof fetch>;
    /**
     * Please don't use the Fetch client for Next.js applications. The `next`
     * options won't have any effect.
     *
     * Install {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`} instead.
     */
    next?: never;
    /**
     * Return the response data parsed in a specified format. By default, `auto`
     * will infer the appropriate method from the `Content-Type` response header.
     * You can override this behavior with any of the {@link Body} methods.
     * Select `stream` if you don't want to parse response data at all.
     *
     * @default 'auto'
     */
    parseAs?: Exclude<keyof Body, 'body' | 'bodyUsed'> | 'auto' | 'stream';
    /**
     * Should we return only data or multiple fields (data, error, response, etc.)?
     *
     * @default 'fields'
     */
    responseStyle?: ResponseStyle;
    /**
     * Throw an error instead of returning it in the response?
     *
     * @default false
     */
    throwOnError?: T['throwOnError'];
}
interface RequestOptions<TResponseStyle extends ResponseStyle = 'fields', ThrowOnError extends boolean = boolean, Url extends string = string> extends Config<{
    responseStyle: TResponseStyle;
    throwOnError: ThrowOnError;
}> {
    /**
     * Any body that you want to add to your request.
     *
     * {@link https://developer.mozilla.org/docs/Web/API/fetch#body}
     */
    body?: unknown;
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    /**
     * Security mechanism(s) to use for the request.
     */
    security?: ReadonlyArray<Auth>;
    url: Url;
}
type RequestResult<TData = unknown, TError = unknown, ThrowOnError extends boolean = boolean, TResponseStyle extends ResponseStyle = 'fields'> = ThrowOnError extends true ? Promise<TResponseStyle extends 'data' ? TData extends Record<string, unknown> ? TData[keyof TData] : TData : {
    data: TData extends Record<string, unknown> ? TData[keyof TData] : TData;
    request: Request;
    response: Response;
}> : Promise<TResponseStyle extends 'data' ? (TData extends Record<string, unknown> ? TData[keyof TData] : TData) | undefined : ({
    data: TData extends Record<string, unknown> ? TData[keyof TData] : TData;
    error: undefined;
} | {
    data: undefined;
    error: TError extends Record<string, unknown> ? TError[keyof TError] : TError;
}) & {
    request: Request;
    response: Response;
}>;
interface ClientOptions {
    baseUrl?: string;
    responseStyle?: ResponseStyle;
    throwOnError?: boolean;
}
type MethodFn = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = 'fields'>(options: Omit<RequestOptions<TResponseStyle, ThrowOnError>, 'method'>) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>;
type RequestFn = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = 'fields'>(options: Omit<RequestOptions<TResponseStyle, ThrowOnError>, 'method'> & Pick<Required<RequestOptions<TResponseStyle, ThrowOnError>>, 'method'>) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>;
type BuildUrlFn = <TData extends {
    body?: unknown;
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    url: string;
}>(options: Pick<TData, 'url'> & Options<TData>) => string;
type Client = Client$1<RequestFn, Config, MethodFn, BuildUrlFn> & {
    interceptors: Middleware<Request, Response, unknown, RequestOptions>;
};
/**
 * The `createClientConfig()` function will be called on client initialization
 * and the returned object will become the client's initial configuration.
 *
 * You may want to initialize your client this way instead of calling
 * `setConfig()`. This is useful for example if you're using Next.js
 * to ensure your client always has the correct values.
 */
type CreateClientConfig<T extends ClientOptions = ClientOptions> = (override?: Config<ClientOptions & T>) => Config<Required<ClientOptions> & T>;
interface TDataShape {
    body?: unknown;
    headers?: unknown;
    path?: unknown;
    query?: unknown;
    url: string;
}
type OmitKeys<T, K> = Pick<T, Exclude<keyof T, K>>;
type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean, TResponseStyle extends ResponseStyle = 'fields'> = OmitKeys<RequestOptions<TResponseStyle, ThrowOnError>, 'body' | 'path' | 'query' | 'url'> & Omit<TData, 'url'>;
type OptionsLegacyParser<TData = unknown, ThrowOnError extends boolean = boolean, TResponseStyle extends ResponseStyle = 'fields'> = TData extends {
    body?: any;
} ? TData extends {
    headers?: any;
} ? OmitKeys<RequestOptions<TResponseStyle, ThrowOnError>, 'body' | 'headers' | 'url'> & TData : OmitKeys<RequestOptions<TResponseStyle, ThrowOnError>, 'body' | 'url'> & TData & Pick<RequestOptions<TResponseStyle, ThrowOnError>, 'headers'> : TData extends {
    headers?: any;
} ? OmitKeys<RequestOptions<TResponseStyle, ThrowOnError>, 'headers' | 'url'> & TData & Pick<RequestOptions<TResponseStyle, ThrowOnError>, 'body'> : OmitKeys<RequestOptions<TResponseStyle, ThrowOnError>, 'url'> & TData;

declare const createClient: (config?: Config) => Client;

export { type Auth, type Client, type ClientOptions, type Config, type CreateClientConfig, type Options, type OptionsLegacyParser, type QuerySerializerOptions, type RequestOptions, type RequestResult, type ResponseStyle, type TDataShape, buildClientParams, createClient, createConfig, formDataBodySerializer, jsonBodySerializer, urlSearchParamsBodySerializer };
