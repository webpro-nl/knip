import type { FileInfo } from "../types/index.js";
export declare const sendRequest: ({ fetchOptions, redirects, timeout, url, }: {
    fetchOptions?: RequestInit;
    redirects?: string[];
    timeout?: number;
    url: URL | string;
}) => Promise<{
    fetchOptions?: RequestInit;
    response: Response;
}>;
export declare const urlResolver: {
    handler: ({ arrayBuffer, fetch: _fetch, file, }: {
        arrayBuffer?: ArrayBuffer;
        fetch?: RequestInit;
        file: FileInfo;
    }) => Promise<void>;
};
