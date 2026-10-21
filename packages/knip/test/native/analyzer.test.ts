import { referenceVisitorRegistry } from '../reference/plugins/registry.ts';
import type { RegisterVisitors } from '../reference/types/config.ts';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import { resolverPlan } from './resolver-plan.ts';
import test from 'node:test';
import { globSync } from 'tinyglobby';
import {
  nativeGetImportsAndExports,
  nativeGetImportsAndExportsWithResolver,
  type NativeVisitorId,
  type NativeVisitorPlan,
} from '../../src/native-analyzer.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from '../../src/types/config.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../reference/types/config.ts';
import { _parseFile, type ResolveModule } from '../../src/typescript/ast-nodes.ts';
import { _getImportsAndExports } from '../reference/typescript/get-imports-and-exports.ts';
import { createCustomModuleResolver } from '../reference/typescript/resolve-module-names.ts';
import { createBunShellVisitor } from '../reference/typescript/visitors/script-visitors.ts';
import { buildVisitor } from '../reference/typescript/visitors/walk.ts';
import { dirname, resolve } from '../../src/util/path.ts';

const options: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: true,
  isFixTypes: true,
  isReportExports: true,
  tags: [[], []],
};
const allPlugins: NativeVisitorPlan = [
  'bun-shell',
  'jest',
  'vitest',
  'rstest',
  'vite',
  'webpack',
  'node',
  'execa',
  'nano-spawn',
  'zx',
  'knex',
  'pino',
  'lit',
  'fast',
  'catalyst',
  'stencil-custom-elements',
  'stencil-style-urls',
  'angular-style-urls',
];
const pluginMap: Partial<Record<NativeVisitorId, RegisterVisitors>> = {
  jest: referenceVisitorRegistry.get('jest'),
  vitest: referenceVisitorRegistry.get('vitest'),
  rstest: referenceVisitorRegistry.get('rstest'),
  vite: referenceVisitorRegistry.get('vite'),
  webpack: referenceVisitorRegistry.get('webpack'),
  rspack: referenceVisitorRegistry.get('rspack'),
  node: referenceVisitorRegistry.get('node'),
  execa: referenceVisitorRegistry.get('execa'),
  'nano-spawn': referenceVisitorRegistry.get('nano-spawn'),
  zx: referenceVisitorRegistry.get('zx'),
  knex: referenceVisitorRegistry.get('knex'),
  pino: referenceVisitorRegistry.get('pino'),
  lit: referenceVisitorRegistry.get('lit'),
  fast: referenceVisitorRegistry.get('fast'),
  catalyst: referenceVisitorRegistry.get('catalyst'),
  'stencil-custom-elements': referenceVisitorRegistry.get('stencil'),
  'stencil-style-urls': referenceVisitorRegistry.get('stencil'),
  'angular-style-urls': referenceVisitorRegistry.get('angular'),
};
const normalize = (value: unknown): unknown => {
  if (value instanceof Map) {
    const entries = [];
    for (const [key, item] of value) entries.push([key, normalize(item)]);
    return { map: entries };
  }
  if (value instanceof Set) {
    const entries = [];
    for (const item of value) entries.push(normalize(item));
    return { set: entries };
  }
  if (value instanceof RegExp) return { regexp: value.source, flags: value.flags };
  if (Array.isArray(value)) {
    const items = [];
    for (const item of value) items.push(normalize(item));
    return items;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = normalize(item);
    return result;
  }
  return value;
};
function oracle(plan: NativeVisitorPlan, includeLocalRefs: boolean) {
  const ctx: PluginVisitorContext = {
    filePath: '',
    sourceText: '',
    addScript() {},
    addImport() {},
    markImportExpressionHandled() {},
    addImportGlob() {},
    markExportRegistered() {},
  };
  const objects: PluginVisitorObject[] = [];
  const registeredPlugins = new Set<string>();
  for (const id of plan) {
    if (id === 'bun-shell') {
      objects.push(createBunShellVisitor(ctx));
      continue;
    }
    const collected: PluginVisitorObject[] = [];
    pluginMap[id]?.({ ctx, registerVisitor: visitor => collected.push(visitor), registeredPlugins });
    if (id === 'stencil-custom-elements') objects.push(collected[0]);
    else if (id === 'stencil-style-urls') objects.push(collected[1]);
    else objects.push(...collected);
  }
  return { visitor: buildVisitor(objects, includeLocalRefs), ctx };
}
function compare(
  filePath: string,
  source: string,
  resolver: ResolveModule,
  config = options,
  ignore: IgnoreExportsUsedInFile = false,
  skip = false,
  plan: NativeVisitorPlan = ['bun-shell']
) {
  const { visitor, ctx } = oracle(plan, !!ignore);
  const expected = _getImportsAndExports(filePath, source, resolver, config, ignore, skip, visitor, ctx);
  const actual = nativeGetImportsAndExports(filePath, source, resolver, config, ignore, skip, plan);
  assert.deepEqual(
    normalize(actual),
    normalize(expected),
    `${filePath}; refs=${JSON.stringify(ignore)}; plan=${plan.join(',')}`
  );
}
const internalResolver: ResolveModule = (specifier, file) => ({
  resolvedFileName: resolve(dirname(file), specifier.startsWith('.') ? specifier : `./${specifier}`),
  isExternalLibraryImport: false,
});
const externalResolver: ResolveModule = specifier => ({
  resolvedFileName: `/workspace/node_modules/${specifier}/index.d.ts`,
  isExternalLibraryImport: true,
});

test('Fused native analyzer preserves empty namespace and import names', () => {
  const sources = [
    'export * as "" from "./dep";',
    'export * as "named" from "./dep";',
    'export { value as "" } from "./dep";',
    'export { "" as value } from "./dep";',
    'export { "" as "" } from "./dep";',
    'import { "" as value } from "./dep"; export { value as "" };',
    'export * as "" from "node:fs";',
  ];
  const resolvers: ResolveModule[] = [
    internalResolver,
    externalResolver,
    () => undefined,
    () => ({ resolvedFileName: '', isExternalLibraryImport: false }),
  ];
  for (const source of sources) {
    for (const resolver of resolvers) compare('/workspace/module.ts', source, resolver);
  }
});

test('Fused native analyzer preserves CommonJS private-field assignment exports', () => {
  const sources = [
    'class C { #field; method(exports) { exports.#field = 1; } }',
    'class C { #field; method(exports) { exports.#field = 1; exports.#field = 2; } }',
    'class C { #field; method(module) { module.exports.#field = 1; } }',
    'class C { #exports; method(module) { module.#exports = { value: 1 }; } }',
    'class C { #exports; method(module) { module.#exports.value = 1; } }',
    'class C { #exports; #field; method(module) { module.#exports.#field = 1; } }',
    'class C { #field; method(exports) { exports.#field += 1; } }',
    'const emoji = "😀";\r\nclass C { #𝒜; method(exports) { exports.#𝒜 = 1; } }',
  ];
  for (const source of sources) {
    for (const extension of ['js', 'cjs', 'ts']) {
      for (const isFixExports of [false, true]) {
        for (const skipExports of [false, true]) {
          compare(
            `/workspace/module.${extension}`,
            source,
            internalResolver,
            { ...options, isFixExports },
            true,
            skipExports
          );
        }
      }
    }
  }
});

test('Fused native analyzer preserves thrown resolver values and stops subsequent callbacks', () => {
  const values: unknown[] = [
    'resolver-marker',
    { marker: 'resolver-marker' },
    new Error('resolver-marker'),
    undefined,
    null,
    false,
    true,
    '',
    0,
    -0,
    NaN,
    42,
    0n,
    Symbol('resolver-marker'),
    () => 'resolver-marker',
  ];
  const sources = [
    'import "before"; import "failure"; import "after";',
    'require("before"); require("failure"); require("after");',
    'import("before"); import("failure"); import("after");',
    'jest.mock("before"); jest.mock("failure"); jest.mock("after");',
  ];
  const capture = (run: () => unknown) => {
    try {
      run();
    } catch (value) {
      return { value };
    }
    assert.fail('Expected the resolver to throw');
  };
  const filePath = '/workspace/module.js';
  const plan: NativeVisitorPlan = ['bun-shell', 'jest'];
  for (const value of values) {
    for (const source of sources) {
      const expectedCalls: string[] = [];
      const actualCalls: string[] = [];
      const resolver =
        (calls: string[]): ResolveModule =>
        (specifier, file) => {
          calls.push(specifier);
          if (specifier === 'failure') throw value;
          return internalResolver(specifier, file);
        };
      const { visitor, ctx } = oracle(plan, false);
      const expected = capture(() =>
        _getImportsAndExports(filePath, source, resolver(expectedCalls), options, false, false, visitor, ctx)
      );
      const actual = capture(() =>
        nativeGetImportsAndExports(filePath, source, resolver(actualCalls), options, false, false, plan)
      );
      assert.strictEqual(expected.value, value);
      assert.strictEqual(actual.value, expected.value);
      assert.deepEqual(actualCalls, expectedCalls);
      assert.equal(expectedCalls.at(-1), 'failure');
      assert.ok(!actualCalls.includes('after'));
    }
  }
});

test('Fused native analyzer matches complete ordered FileNodes across actual fixture sources and resolver contexts', () => {
  const resolver = createCustomModuleResolver({}, ['.vue', '.scss', '.mdx'], path => path);
  const context = new NativeModuleResolver(resolverPlan({ customCompilerExtensions: ['.vue', '.scss', '.mdx'] }));
  const files = globSync('fixtures/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}', {
    ignore: ['**/tmp/**', '**/node_modules/**'],
  }).sort();
  assert.ok(files.length > 1000);
  for (const file of files) {
    if (process.env.KNIP_NATIVE_ANALYZER_FILTER && !file.includes(process.env.KNIP_NATIVE_ANALYZER_FILTER)) continue;
    const path = resolve(file);
    const source = readFileSync(path, 'utf8');
    compare(path, source, resolver);
    const { visitor, ctx } = oracle(['bun-shell'], false);
    const expected = _getImportsAndExports(path, source, resolver, options, false, false, visitor, ctx);
    assert.deepEqual(
      normalize(nativeGetImportsAndExportsWithResolver(path, source, context, options, false, false)),
      normalize(expected)
    );
    compare(path, source, internalResolver, options, true);
    compare(
      path,
      source,
      externalResolver,
      { ...options, skipTypeOnly: true, isFixTypes: false },
      { type: true, interface: true }
    );
  }
});

test('Fused native analyzer preserves plugin combinations, order and Program exit behavior across fixtures', () => {
  const resolver = createCustomModuleResolver({}, ['.scss', '.css'], path => path);
  const files = globSync(
    ['fixtures/plugins/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}', 'fixtures/language/custom-elements/**/*.{js,jsx,ts,tsx}'],
    { ignore: ['**/node_modules/**', '**/tmp/**'] }
  ).sort();
  for (const file of files) {
    if (process.env.KNIP_NATIVE_ANALYZER_FILTER && !file.includes(process.env.KNIP_NATIVE_ANALYZER_FILTER)) continue;
    const path = resolve(file);
    const source = readFileSync(path, 'utf8');
    compare(path, source, resolver, options, true, false, allPlugins);
    compare(path, source, internalResolver, { ...options, isReportExports: false }, false, false, [
      'webpack',
      'vite',
      'webpack',
      'bun-shell',
      'node',
    ]);
  }
});

test('Fused native analyzer preserves Unicode, CRLF, surrogate strings and recoverable parse errors', () => {
  const sources = [
    '/* 🍎 @public */\r\nexport const café = 1;\r\nexport { café as météo };\r\nconsole.log(café);',
    'export enum Météo { "🍎" = 1, "\\u00e9" = 2, Rain = 3 }\r\nMétéo.Rain;',
    'import { "\\ud800" as value } from "package\\udfff"; export { value as "\\ud800" };',
    'const value = require("package\\ud800"); import(`other\\udfff`); export const "invalid" = 1;',
    'const nul = require("a\\0b"); const sentinel = require("a\\0Saaaa");',
    'export const repeated = 1; export const repeated = 2;',
    'import x from "./x"; import x from "./y"; export { x };',
    'export function broken( {',
    '/** @import {A} from "types" */\r\n/// <reference path="./absent.d.ts" />\r\nexport {};',
  ];
  for (const source of sources) {
    for (const resolver of [internalResolver, externalResolver, () => undefined]) {
      compare('/workspace/module.ts', source, resolver, options, true, false, allPlugins);
    }
  }
});

test('Fused native analyzer keeps shadowing, declaration protection, bindings and namespace members exact', () => {
  const sources = [
    'import * as ns from "./members"; import { Kind } from "./members"; const alias=ns; const container={ns}; alias.one; container.ns.two; ns.Three["0"]; Kind["1e+21"]; for(const key in ns) {}',
    'export enum Kind { A, B }; function shadow(Kind: unknown) { return Kind.A; } Kind.B; export const {first,second:other=2,...rest}=factory(); first;',
    'export interface Private { brand: unique symbol }; const helpers={get():Private{return {} as Private}}; export const result=helpers.get(); export const next=wrap(inner); function inner():Private{return {} as Private} function wrap<T>(x:T){return x}',
    'interface Wrapper { value: number }; export interface Branded { readonly brand: unique symbol }; interface Named { value: Branded }; const get=(x:Named)=>x.value; export const result=get({});',
    'export namespace Outer { export namespace Inner { export const value=1; export const unused=2; }; export const result=Inner.value; } Outer.Inner.value;',
    'import fs from "node:fs"; import * as proc from "node:child_process"; export {fs,proc as process}; export default fs;',
    'declare module "./local" { interface Thing extends Remote { field: Other } } export {};',
    'declare module "ambient" { import type { Value } from "types"; export { Other } from "other"; }',
    'import {Foo} from "./dep"; export type Result=import("./other").Foo.Bar; export namespace Ns {export interface Value{}}; type Local=import("./another").Ns.Value;',
    'export const assigned=1; export const fallback=2; ({assigned=fallback}=source);',
    'export const candidate={}; class Example { #field; check() { return #field in candidate; } }',
  ];
  sources.push('export namespace Outer { export const value=1 }; namespace Outer.Inner.Deep {}');
  sources.push(
    'import * as ns from "./dep"; export {ns}; interface Derived extends ns.Base {}; class Concrete implements ns.Contract {}; type Value=ns.Other;'
  );
  sources.push(
    'import * as ns from "./dep"; interface Deep extends ns.First.Second.Third.Fourth {}; class DeepClass implements ns.First.Second.Third.Fourth {}'
  );
  for (const source of sources)
    for (const ignore of [false, true, { enum: true, type: true }])
      compare('/workspace/module.ts', source, internalResolver, options, ignore);
  for (const path of [
    '/workspace/types.d.ts',
    '/workspace/types.d.cts',
    '/workspace/types.d.mts',
    '/workspace/component.vue',
  ])
    compare(path, sources[5], internalResolver, options, true);
});

test('Fused native analyzer retains host alias, workspace source mapping and package attribution', () => {
  const fixture = resolve('fixtures');
  const resolver = createCustomModuleResolver(
    {
      scopedPaths: [
        { scope: fixture, paths: { '@source/*': [`${fixture}/$1`], '@local': [`${fixture}/imports/basic/dep.ts`] } },
      ],
      scopedRootDirs: [{ scope: fixture, rootDirs: [`${fixture}/language`, `${fixture}/imports`] }],
    },
    ['.scss'],
    path => path.replace('/dist/', '/src/')
  );
  const source =
    'import * as mapped from "@local"; import { value as local } from "@source/imports/basic/dep"; export {mapped,local}; mapped.member; local.deep.value;';
  compare(`${fixture}/main.ts`, source, resolver, options, true);
  const classified: ResolveModule = specifier => {
    if (specifier === 'absent') return undefined;
    if (specifier === 'workspace')
      return {
        resolvedFileName: '/workspace/packages/library/src/index.ts',
        isExternalLibraryImport: true,
        packageName: '@scope/library',
      };
    return {
      resolvedFileName: '/workspace/node_modules/canonical/index.js',
      isExternalLibraryImport: true,
      packageName: '@scope/canonical',
    };
  };
  compare(
    '/workspace/consumer.ts',
    'import type {Value} from "alias"; import {item} from "workspace"; export {item}; import "absent";',
    classified,
    { ...options, skipTypeOnly: true },
    true
  );
});

test('Fused native analyzer preserves dynamic imports, plugin edge cases and reversed registration order', () => {
  const sources: Array<[string, string]> = [
    [
      'dynamic',
      'const {value: renamed, "with space": named, [key]: computed, ...rest}=await import("./🍎"); const ns=await import(`./ns`); ns.first; const {second,...other}=ns; const pending=import("./pending"); import("./side");',
    ],
    [
      'promise',
      'const [{foo:alias},ns,,...rest]=await Promise.all([import("./one"),import("./two"),import("./three"),import("./four"),...extra,import("./five")]); ns.value;',
    ],
    [
      'require',
      '/** @public */ const {named:alias,[key]:computed, "str":name,...rest}=require("./dep"); const ns=require(`./ns`); require("./side"); require.resolve("./resolved"); import.meta.resolve("./meta");',
    ],
    [
      'aliases',
      'import * as ns from "./one"; import {object as obj, value} from "./two"; const one=ns; const two=flag?one:ns; const spread={...ns}; const container={ns}; const {foo,...rest}=ns.deep; const {a=value,b:aliased=ns}=thing; container.ns.foo; one.bar; Object.keys(ns); Object.values(obj); work(ns, [ns], {ns, ...ns});',
    ],
    [
      'loaders',
      'lazy(()=>import("./one")); lazy(async()=>await import("./two")); lazy(()=>(import("./three"))); lazy(()=>{return import("./four")}); lazy(async()=>{return await import("./five")});',
    ],
    [
      'paths',
      'import {join,resolve} from "node:path"; import * as cp from "child_process"; import {exec as command,spawn as run,fork} from "node:child_process"; import {Worker} from "worker_threads"; import {register} from "node:module"; register("./loader",import.meta.url); register("./ignored"); register("named"); new URL("./asset",import.meta.url); new Worker(join(__dirname,"w.js")); fork(resolve(__dirname,"/jobs//","task.js")); cp.spawn(path.join(__dirname,"a.js")); cp.exec(`node ${file}`); command("npm run build"); run("node",["safe.js",dynamic,"unsafe arg"]);',
    ],
    [
      'registry',
      'export class First {}; export class Second {}; const r=customElements; r.define("x-first",First); const scoped=new CustomElementRegistry(); scoped.define("x-second",Second); export class Self { static { customElements.define("x-self",this); } }; export class Shadow {}; function register(Shadow){customElements.define("x-shadow",Shadow)};',
    ],
    [
      'jest',
      'j.mock("virtual"); j.requireMock("virtual"); j.requireActual("virtual"); j.createMockFromModule("actual"); j.mock("virtual",()=>({}),{virtual:true}); j.unstable_unmockModule("esm"); j.unstable_mockModule("esm",()=>({}),{virtual:true}); j.unmock("esm"); j.deepUnmock("real"); import {jest as j} from "@jest/globals"; function f(j){j.mock("shadow")};',
    ],
    [
      'mock',
      'v.mock(import("./one"),()=>({x:1})); v.mock(import("./two"),async()=>({x:1})); v.mock(import("./three"),()=>({...rest})); v.mock(import("./four"),a=>({x:a})); v.mock(import("./five"),()=>(({x:1}))); r.doMock(import("./six"),()=>({})); import {vi as v} from "vitest"; import {rs as r} from "@rstest/core";',
    ],
    [
      'vite',
      'import.meta.glob(["./one/*",dynamic,`./two/*`]); import.meta.glob("./a",{query:"?raw"}); import.meta.glob("./b",{query:"raw&x"}); import.meta.glob("./c",{query:"draw"}); import.meta.glob("./d",{query:{raw:""}}); import.meta.glob("./e",{as:"raw"}); import.meta.glob("./f",{query:{[raw]:""}});',
    ],
    [
      'webpack',
      'require.context("./one"); require.context("./two",false,/a\\/b/giu); require.context(`./three`,true,/(?:)/); require.context("",undefined,/x/);',
    ],
    [
      'node-glob',
      'import * as fs from "node:fs/promises"; import {glob as g} from "fs/promises"; const {glob:local}=require("fs/promises"); g(["./a","./b"],{cwd:".."}); fs.glob("./c"); local("./d"); g(["./a",dynamic]); g(["!./a"]); g("./a",{cwd:"..",exclude:"x"}); g("./a",{[cwd]:".."}); g("./a",{});',
    ],
    [
      'scripts',
      '$`node ${file}`; $sync({cwd:here})`tsc --noEmit`; execaNode`./run ${arg}`; execa("pnpm",["run","build",...args,"not safe"]); execaSync("node",["x.js"]); execaCommand(`node ${script}`); execaNode("file.js",["--one"]); spawn("bun",["run","task.ts"]);',
    ],
    [
      'knex',
      'import factory,{knex as make} from "knex"; factory({client:"mysql"}); make({client:"POSTGRESQL"}); factory.knex({client:`oracle`}); const {knex:k}=require("knex"); k({client:"cockroachdb"}); const direct=require("knex"); direct({client:"bad"}); make({"client":"sqlite3"});',
    ],
    [
      'pino',
      'import pino,{transport as trans} from "pino"; pino({transport:{targets:[{target:"one"},{pipeline:[{target:"./two"}]}]}}); pino.transport({target:"three"}); trans({pipeline:[{target:"four"},{target:"./node_modules/five"}]});',
    ],
    [
      'lit',
      'import {customElement as ce} from "lit/decorators"; import * as d from "lit-element/decorators.js"; @ce("one") export class First {}; @d.customElement("two") export default class Second {}; function f(){@ce("three") class Inner {}}; const Expr=@ce("four") class {};',
    ],
    [
      'fast',
      'import {FASTElement as Base,customElement} from "@microsoft/fast-element"; export class First extends Base {}; First.define({name:"x-first"}); export class Second extends mixin(Base) {}; Second.defineAsync({}); @customElement("third") export class Third extends Base {}; function nested(){class Local extends Base {}; Local.define({})};',
    ],
    [
      'catalyst',
      'import {controller as register} from "@github/catalyst"; @register export class Element {}; @register export default class {};',
    ],
    [
      'styles',
      'import {Component as Angular} from "@angular/core"; import {Component as Stencil} from "@stencil/core"; @Angular({styleUrls:["a.css","a.css","../b.scss"],styleUrl:"./c.css"}) export class First {}; @Stencil({styleUrls:{one:"./d.scss",two:"/e.css"},styleUrl:"./f.css"}) export class Second {};',
    ],
    [
      'unicode',
      'const {"\\ud800":value,[key]:computed}=await import("./🍎\\udfff"); jest.mock("pkg\\ud800"); import.meta.glob("./\\udfff"); execaCommand("node a\\0b");',
    ],
  ];
  sources.push([
    'style-paths',
    'import {Component} from "@angular/core"; @Component({styleUrls:["","../","/","..","./","a/","../../escape.css"]}) export class PathCases {}',
  ]);

  for (const [name, source] of sources) {
    for (const resolver of [internalResolver, externalResolver, () => undefined]) {
      for (const plan of [allPlugins, allPlugins.toReversed(), ['bun-shell'] satisfies NativeVisitorPlan]) {
        compare(`/workspace/${name}.ts`, source, resolver, options, true, false, plan);
      }
    }
  }
});

test('Fused native analyzer preserves option boundaries and propagates host resolver failures', () => {
  const source =
    '/** @public */ import {Thing} from "absent"; /** @ignored */ const value=require("missing"); export type Type=Thing; export const item=value;';
  for (const isReportExports of [false, true]) {
    for (const skipExports of [false, true]) {
      for (const skipTypeOnly of [false, true]) {
        for (const ignore of [false, true, {}]) {
          compare(
            '/workspace/module.d.ts',
            source,
            () => undefined,
            { ...options, isReportExports, skipTypeOnly, tags: [['@public'], ['@ignored']] },
            ignore,
            skipExports,
            []
          );
        }
      }
    }
  }
  assert.throws(
    () =>
      nativeGetImportsAndExports(
        '/workspace/module.ts',
        'import value from "host-error";',
        () => {
          throw new Error('resolver-marker');
        },
        options,
        false,
        false
      ),
    /resolver-marker/
  );
});

test('Fused native analyzer preserves private-member predicates in core and plugins', () => {
  const sources = [
    'class C { #resolve; m(require) { require.#resolve("./dep"); } }',
    'class C { #resolve; m() { import.meta.#resolve("./dep"); new.target.#resolve("./other"); } }',
    'class C { #all; async m(Promise) { const [ns] = await Promise.#all([import("./dep")]); ns.x; } }',
    'class C { #all; async m(Promise) { const [{ x }, , ...rest] = await Promise.#all([import("./dep"), import("./other"), import("./third")]); } }',
    'import "node:module"; class C { #register; m(module) { module.#register("loader"); } }',
    'import "node:module"; class C { #register; #url; m(module) { module.#register("./loader", import.meta.#url); register("./other", new.target.#url); } }',
    'class C { #url; m() { new URL("./dep", import.meta.#url); new URL("./other", new.target.#url); } }',
    'class C { #context; m(require) { require.#context("./plugins", false, /x/); } }',
    'class C { #glob; m() { import.meta.#glob("./*.ts"); new.target.#glob("./*.js", { query: "?raw" }); } }',
    'class C { #mock; m() { jest.#mock("./dep"); vi.#mock(import("./vi"), () => ({})); rs.#mock(import("./rs"), () => ({})); } }',
    'import * as fs from "node:fs/promises"; class C { #glob; m() { fs.#glob("./*.ts"); } }',
    'import cp from "node:child_process"; class C { #exec; #fork; m() { cp.#exec("echo hello"); cp.#fork(path.join(__dirname, "./dep")); } }',
    'import { fork } from "node:child_process"; class C { #join; m(path) { fork(path.#join(__dirname, "./dep")); } }',
    'import * as ns from "./dep"; class C { #keys; m() { Object.#keys(ns); } }',
    'import * as ns from "./dep"; class C { #value; m() { const { x } = ns.#value; } }',
    'export class C { #define; static { customElements.#define("tag-name", this); } }',
    'export class C { #customElements; static { const registry = window.#customElements; registry.define("tag-name", this); window.#customElements.define("tag-other", this); } }',
    'import knex from "knex"; class C { #knex; m() { knex.#knex({ client: "pg" }); } }',
    'import pino from "pino"; class C { #transport; m() { pino.#transport({ target: "./transport" }); } }',
    'import { FASTElement } from "@microsoft/fast-element"; export class C extends FASTElement { #define; static { C.#define("tag-name"); } }',
  ];
  const resolvers: ResolveModule[] = [internalResolver, externalResolver, () => undefined];
  for (const source of sources) {
    for (const resolver of resolvers) {
      compare('/workspace/private.ts', source, resolver, options, true, false, allPlugins);
      compare('/workspace/private.js', source, resolver, options, false, false, allPlugins.toReversed());
    }
  }
});

test('Fused native analyzer validates regexes at plugin encounter before later resolver callbacks', () => {
  const sources = [
    'require.context("./plugins", true, /(/); require("after");',
    'require("before"); require.context("./plugins", true, /(/); require("after");',
    'require.context("./plugins", true, /a/uv); require("after");',
    'require.context("./plugins", true, /a{2,1}/u); require("after");',
    'require.context("./plugins", true, /\\k<missing>/u); require("after");',
    'class C { #context; m(require) { require.#context("./plugins", true, /(/); require("after"); } }',
  ];
  const capture = (run: () => unknown) => {
    try {
      run();
    } catch (error) {
      return error;
    }
    assert.fail('Expected an invalid regular expression');
  };
  const plans: NativeVisitorPlan[] = [['webpack'], ['rspack'], ['webpack', 'rspack']];
  for (const source of sources) {
    for (const visitors of plans) {
      const expectedCalls: string[] = [];
      const actualCalls: string[] = [];
      const resolveAfter =
        (calls: string[]): ResolveModule =>
        (specifier, filePath) => {
          calls.push(specifier);
          if (specifier === 'after') throw new Error('resolver-after-marker');
          return internalResolver(specifier, filePath);
        };
      const { visitor, ctx } = oracle(visitors, false);
      const expected = capture(() =>
        _getImportsAndExports(
          '/workspace/module.ts',
          source,
          resolveAfter(expectedCalls),
          options,
          false,
          false,
          visitor,
          ctx
        )
      );
      const actual = capture(() =>
        nativeGetImportsAndExports(
          '/workspace/module.ts',
          source,
          resolveAfter(actualCalls),
          options,
          false,
          false,
          visitors
        )
      );
      assert.ok(expected instanceof SyntaxError);
      assert.ok(actual instanceof SyntaxError);
      assert.equal(actual.message, expected.message);
      assert.deepEqual(actualCalls, expectedCalls);
      assert.ok(!actualCalls.includes('after'));
    }
  }
});

test('Fused native analyzer constructs each regex once and preserves constructor errors', () => {
  const source =
    'require.context("./one", true, /a/ig); require.context("./none"); import.meta.glob("./*.ts"); require.context("./two", false, /b/); require("after");';
  const plan: NativeVisitorPlan = ['webpack', 'vite', 'rspack'];
  const OriginalRegExp = RegExp;
  const run = (native: boolean, thrown?: { value: unknown }, resolverThrown?: { value: unknown }) => {
    const text = resolverThrown ? `require("before"); ${source}` : source;
    const parsed = native ? undefined : _parseFile('/workspace/module.ts', text);
    if (parsed) void parsed.program;
    const calls: unknown[][] = [];
    const constructed: RegExp[] = [];
    const resolved: string[] = [];
    globalThis.RegExp = new Proxy(OriginalRegExp, {
      construct(target, args) {
        calls.push(args);
        if (thrown) throw thrown.value;
        const result: RegExp = Reflect.construct(target, args);
        constructed.push(result);
        return result;
      },
    });
    const resolver: ResolveModule = (specifier, filePath) => {
      resolved.push(specifier);
      if (resolverThrown) throw resolverThrown.value;
      return internalResolver(specifier, filePath);
    };
    try {
      const { visitor, ctx } = oracle(plan, false);
      const result = native
        ? nativeGetImportsAndExports('/workspace/module.ts', text, resolver, options, false, false, plan)
        : _getImportsAndExports('/workspace/module.ts', text, resolver, options, false, false, visitor, ctx, parsed);
      let index = 0;
      for (const glob of result.importGlobs) {
        if (glob.filter) assert.strictEqual(glob.filter, constructed[index++]);
      }
      assert.equal(index, constructed.length);
      return { result, calls, resolved };
    } catch (error) {
      return { error, calls, resolved };
    } finally {
      globalThis.RegExp = OriginalRegExp;
    }
  };
  const expected = run(false);
  const actual = run(true);
  if ('error' in expected) throw expected.error;
  if ('error' in actual) throw actual.error;
  assert.equal(actual.calls.length, 4);
  assert.deepEqual(normalize(actual), normalize(expected));
  for (const value of [undefined, null, 'regex-marker', { marker: 'regex-marker' }, new Error('regex-marker')]) {
    const expectedError = run(false, { value });
    const actualError = run(true, { value });
    assert.ok('error' in expectedError);
    assert.ok('error' in actualError);
    assert.strictEqual(expectedError.error, value);
    assert.strictEqual(actualError.error, value);
    assert.deepEqual(actualError.calls, expectedError.calls);
    assert.deepEqual(actualError.resolved, []);
    const expectedResolver = run(false, undefined, { value });
    const actualResolver = run(true, undefined, { value });
    assert.ok('error' in expectedResolver);
    assert.ok('error' in actualResolver);
    assert.strictEqual(expectedResolver.error, value);
    assert.strictEqual(actualResolver.error, value);
    assert.deepEqual(actualResolver.calls, []);
    assert.deepEqual(actualResolver.resolved, expectedResolver.resolved);
  }
});

test('Both native analyzer entry paths preserve exact UTF-16 source origins', () => {
  const directory = realpathSync(mkdtempSync(`${tmpdir()}/knip-native-path-`));
  try {
    writeFileSync(`${directory}/dep.ts`, 'export const foo = 1;');
    const native = new NativeModuleResolver(resolverPlan());
    const host = createCustomModuleResolver({}, [], () => undefined);
    const sources = [
      'import { foo } from "./dep"; export const value = foo;',
      'export { foo } from "./dep"; export * as ns from "./dep";',
    ];
    for (const name of ['normal', '\ud800', '\udc00', '\0Sd800', '\0N', '😀']) {
      const file = `${directory}/${name}.ts`;
      for (const source of sources) {
        const { visitor, ctx } = oracle([], false);
        const expected = _getImportsAndExports(file, source, host, options, false, false, visitor, ctx);
        assert.deepEqual(
          normalize(nativeGetImportsAndExports(file, source, host, options, false, false, [])),
          normalize(expected)
        );
        assert.deepEqual(
          normalize(nativeGetImportsAndExportsWithResolver(file, source, native, options, false, false, [])),
          normalize(expected)
        );
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Native plugin paths and cwd follow the current runtime UTF-16 path operations', () => {
  const native = new NativeModuleResolver(resolverPlan({ customCompilerExtensions: ['.css'] }));
  const host = createCustomModuleResolver({}, ['.css'], () => undefined);
  const plan: NativeVisitorPlan = ['angular-style-urls', 'node'];
  for (const text of ['\ud800', '\udc00', '\0Sd800', '\0N', '😀']) {
    for (const file of [`/workspace/${text}/component.ts`, `${text}/component.ts`]) {
      const source = `import { Component } from '@angular/core'; import { glob } from 'node:fs/promises'; @Component({styleUrl:${JSON.stringify(`./${text}.css`)}}) class Example {} glob('*.ts',{cwd:${JSON.stringify(text)}});`;
      const { visitor, ctx } = oracle(plan, false);
      const expected = _getImportsAndExports(file, source, host, options, false, false, visitor, ctx);
      assert.deepEqual(
        normalize(nativeGetImportsAndExports(file, source, host, options, false, false, plan)),
        normalize(expected)
      );
      assert.deepEqual(
        normalize(nativeGetImportsAndExportsWithResolver(file, source, native, options, false, false, plan)),
        normalize(expected)
      );
    }
  }
});

test('Production context bypasses the arbitrary JavaScript resolution callback API', () => {
  const require = createRequire(import.meta.url);
  const addon: { analyzeFile: unknown } = require('knip/native');
  const original = addon.analyzeFile;
  addon.analyzeFile = () => {
    throw new Error('Unexpected JavaScript resolution callback entry');
  };
  try {
    const native = new NativeModuleResolver(resolverPlan());
    const file = nativeGetImportsAndExportsWithResolver(
      '/workspace/context.ts',
      'import x from "missing"; export {x};',
      native,
      options,
      false,
      false,
      []
    );
    assert.equal(file.imports.unresolved.size, 2);
  } finally {
    addon.analyzeFile = original;
  }
});
