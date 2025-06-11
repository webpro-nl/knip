"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlResolver = exports.sendRequest = void 0;
const ono_1 = require("@jsdevtools/ono");
const url_js_1 = require("../util/url.js");
const errors_js_1 = require("../util/errors.js");
const sendRequest = async ({ fetchOptions, redirects = [], timeout = 60000, url, }) => {
    url = new URL(url);
    redirects.push(url.href);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);
    const response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions,
    });
    clearTimeout(timeoutId);
    if (response.status >= 300 && response.status <= 399) {
        if (redirects.length > 5) {
            throw new errors_js_1.ResolverError((0, ono_1.ono)({ status: response.status }, `Error requesting ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`));
        }
        if (!("location" in response.headers) || !response.headers.location) {
            throw (0, ono_1.ono)({ status: response.status }, `HTTP ${response.status} redirect with no location header`);
        }
        return (0, exports.sendRequest)({
            fetchOptions,
            redirects,
            timeout,
            url: (0, url_js_1.resolve)(url.href, response.headers.location),
        });
    }
    return { fetchOptions, response };
};
exports.sendRequest = sendRequest;
exports.urlResolver = {
    handler: async ({ arrayBuffer, fetch: _fetch, file, }) => {
        let data = arrayBuffer;
        if (!data) {
            try {
                const { fetchOptions, response } = await (0, exports.sendRequest)({
                    fetchOptions: {
                        method: 'GET',
                        ..._fetch,
                    },
                    url: file.url,
                });
                if (response.status >= 400) {
                    // gracefully handle HEAD method not allowed
                    if (response.status !== 405 || fetchOptions?.method !== 'HEAD') {
                        throw (0, ono_1.ono)({ status: response.status }, `HTTP ERROR ${response.status}`);
                    }
                }
                data = response.body ? await response.arrayBuffer() : new ArrayBuffer(0);
            }
            catch (error) {
                throw new errors_js_1.ResolverError((0, ono_1.ono)(error, `Error requesting ${file.url}`), file.url);
            }
        }
        file.data = Buffer.from(data);
    },
};
