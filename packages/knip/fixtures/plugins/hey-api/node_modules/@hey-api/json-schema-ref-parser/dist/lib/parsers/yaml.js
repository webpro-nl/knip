"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yamlParser = void 0;
const errors_js_1 = require("../util/errors.js");
const js_yaml_1 = __importDefault(require("js-yaml"));
const js_yaml_2 = require("js-yaml");
exports.yamlParser = {
    // JSON is valid YAML
    canHandle: (file) => [".yaml", ".yml", ".json"].includes(file.extension),
    handler: async (file) => {
        const data = Buffer.isBuffer(file.data) ? file.data.toString() : file.data;
        if (typeof data !== "string") {
            // data is already a JavaScript value (object, array, number, null, NaN, etc.)
            return data;
        }
        try {
            const yamlSchema = js_yaml_1.default.load(data, { schema: js_yaml_2.JSON_SCHEMA });
            return yamlSchema;
        }
        catch (error) {
            throw new errors_js_1.ParserError(error?.message || "Parser Error", file.url);
        }
    },
    name: 'yaml',
};
