"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonParser = void 0;
const errors_js_1 = require("../util/errors.js");
exports.jsonParser = {
    canHandle: (file) => file.extension === '.json',
    async handler(file) {
        let data = file.data;
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }
        if (typeof data !== "string") {
            // data is already a JavaScript value (object, array, number, null, NaN, etc.)
            return data;
        }
        if (!data.trim().length) {
            // this mirrors the YAML behavior
            return;
        }
        try {
            return JSON.parse(data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }
        catch (error) {
            try {
                // find the first curly brace
                const firstCurlyBrace = data.indexOf("{");
                // remove any characters before the first curly brace
                data = data.slice(firstCurlyBrace);
                return JSON.parse(data);
            }
            catch (error) {
                throw new errors_js_1.ParserError(error.message, file.url);
            }
        }
    },
    name: 'json',
};
