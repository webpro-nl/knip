"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsonSchemaRefParserDefaultOptions = void 0;
const json_js_1 = require("./parsers/json.js");
const yaml_js_1 = require("./parsers/yaml.js");
const text_js_1 = require("./parsers/text.js");
const binary_js_1 = require("./parsers/binary.js");
const getJsonSchemaRefParserDefaultOptions = () => ({
    /**
     * Determines the types of JSON references that are allowed.
     */
    dereference: {
        /**
         * Dereference circular (recursive) JSON references?
         * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
         * If "ignore", then circular references will not be dereferenced.
         *
         * @type {boolean|string}
         */
        circular: true,
        /**
         * A function, called for each path, which can return true to stop this path and all
         * subpaths from being dereferenced further. This is useful in schemas where some
         * subpaths contain literal $ref keys that should not be dereferenced.
         *
         * @type {function}
         */
        excludedPathMatcher: () => false,
        // @ts-expect-error
        referenceResolution: "relative",
    },
    /**
     * Determines how different types of files will be parsed.
     *
     * You can add additional parsers of your own, replace an existing one with
     * your own implementation, or disable any parser by setting it to false.
     */
    parse: {
        binary: { ...binary_js_1.binaryParser },
        json: { ...json_js_1.jsonParser },
        text: { ...text_js_1.textParser },
        yaml: { ...yaml_js_1.yamlParser },
    },
});
exports.getJsonSchemaRefParserDefaultOptions = getJsonSchemaRefParserDefaultOptions;
