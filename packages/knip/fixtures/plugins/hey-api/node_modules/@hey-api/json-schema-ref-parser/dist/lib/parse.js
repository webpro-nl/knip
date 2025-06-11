"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFile = void 0;
exports.newFile = newFile;
const ono_1 = require("@jsdevtools/ono");
const url_js_1 = require("./util/url.js");
const plugins = __importStar(require("./util/plugins.js"));
const errors_js_1 = require("./util/errors.js");
/**
 * Prepares the file object so we can populate it with data and other values
 * when it's read and parsed. This "file object" will be passed to all
 * resolvers and parsers.
 */
function newFile(path) {
    let url = path;
    // Remove the URL fragment, if any
    const hashIndex = url.indexOf("#");
    let hash = "";
    if (hashIndex > -1) {
        hash = url.substring(hashIndex);
        url = url.substring(0, hashIndex);
    }
    return {
        extension: (0, url_js_1.getExtension)(url),
        hash,
        url,
    };
}
/**
 * Parses the given file's contents, using the configured parser plugins.
 */
const parseFile = async (file, options) => {
    try {
        // If none of the parsers are a match for this file, try all of them. This
        // handles situations where the file is a supported type, just with an
        // unknown extension.
        const parsers = [options.parse.json, options.parse.yaml, options.parse.text, options.parse.binary];
        const filtered = parsers.filter((plugin) => plugin.canHandle(file));
        return await plugins.run(filtered.length ? filtered : parsers, file);
    }
    catch (error) {
        if (error && error.message && error.message.startsWith("Error parsing")) {
            throw error;
        }
        if (!error || !("error" in error)) {
            throw ono_1.ono.syntax(`Unable to parse ${file.url}`);
        }
        if (error.error instanceof errors_js_1.ParserError) {
            throw error.error;
        }
        throw new errors_js_1.ParserError(error.error.message, file.url);
    }
};
exports.parseFile = parseFile;
