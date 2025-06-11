"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textParser = void 0;
const errors_js_1 = require("../util/errors.js");
const TEXT_REGEXP = /\.(txt|htm|html|md|xml|js|min|map|css|scss|less|svg)$/i;
exports.textParser = {
    canHandle: (file) => (typeof file.data === "string" || Buffer.isBuffer(file.data)) && TEXT_REGEXP.test(file.url),
    handler(file) {
        if (typeof file.data === "string") {
            return file.data;
        }
        if (!Buffer.isBuffer(file.data)) {
            throw new errors_js_1.ParserError("data is not text", file.url);
        }
        return file.data.toString('utf-8');
    },
    name: 'text',
};
