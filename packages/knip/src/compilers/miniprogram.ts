import { parseWxml, parseWxs, parseWxss } from '../plugins/miniprogram/parser.js';
import type { HasDependency } from './types.js';

// Enable compilers when miniprogram-api-typings is present (indicating a Mini Program project)
const isMiniprogramProject = (hasDependency: HasDependency) => {
  return hasDependency('miniprogram-api-typings');
};

// We don't parse JSON files in the compiler because:
// 1. When a component path is referenced (e.g. "./foobar"), we can't determine if it's:
//    - "./foobar.json" (single file) or
//    - "./foobar/index.json" (directory)
// 2. The only purpose of this JSON compiler is to make getCompilerExtensions include
//    JSON files as project files, so they can be analyzed for usage
const parseJson = (text: string) => {
  return text;
};

const wxml = { condition: isMiniprogramProject, compiler: parseWxml };
const wxss = { condition: isMiniprogramProject, compiler: parseWxss };
const wxs = { condition: isMiniprogramProject, compiler: parseWxs };
const json = { condition: isMiniprogramProject, compiler: parseJson };

export default { wxml, wxss, wxs, json };
