"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
/**
 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
 * Each method can return a synchronous value, a Promise, or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further plugins are called.
 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
 * If ALL plugins fail, then the last error is thrown.
 */
async function run(plugins, file) {
    let index = 0;
    let lastError;
    let plugin;
    return new Promise((resolve, reject) => {
        const runNextPlugin = async () => {
            plugin = plugins[index++];
            if (!plugin) {
                // there are no more functions, re-throw the last error
                return reject(lastError);
            }
            try {
                const result = await plugin.handler(file);
                if (result !== undefined) {
                    return resolve({
                        plugin,
                        result,
                    });
                }
                if (index === plugins.length) {
                    throw new Error("No promise has been returned.");
                }
            }
            catch (e) {
                lastError = {
                    plugin,
                    error: e,
                };
                runNextPlugin();
            }
        };
        runNextPlugin();
    });
}
