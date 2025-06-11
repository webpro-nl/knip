"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binaryParser = void 0;
const BINARY_REGEXP = /\.(jpeg|jpg|gif|png|bmp|ico)$/i;
exports.binaryParser = {
    canHandle: (file) => Buffer.isBuffer(file.data) && BINARY_REGEXP.test(file.url),
    handler: (file) => Buffer.isBuffer(file.data)
        ? file.data
        // This will reject if data is anything other than a string or typed array
        : Buffer.from(file.data),
    name: 'binary',
};
