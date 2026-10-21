import assert from 'node:assert/strict';
import test from 'node:test';
import { nativeGetImportsAndExports } from '../../src/native-analyzer.ts';
import { getNativeVisitorPlan } from '../../src/native-visitor-plan.ts';
import { PluginEntries } from '../../src/plugins.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import type { PluginName } from '../../src/types/PluginNames.ts';
import type { ResolveModule } from '../../src/typescript/ast-nodes.ts';
import { dirname, resolve } from '../../src/util/path.ts';
import { referenceVisitorRegistry } from '../reference/plugins/registry.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../reference/types/config.ts';
import { _getImportsAndExports } from '../reference/typescript/get-imports-and-exports.ts';
import { createBunShellVisitor } from '../reference/typescript/visitors/script-visitors.ts';
import { buildVisitor } from '../reference/typescript/visitors/walk.ts';

const context = (): PluginVisitorContext => ({
  filePath: '',
  sourceText: '',
  addScript() {},
  addImport() {},
  markImportExpressionHandled() {},
  addImportGlob() {},
  markExportRegistered() {},
});

test('Native visitor metadata covers the original built-in factory registry', () => {
  const actual: string[] = [];
  for (const [name, plugin] of PluginEntries) {
    if (!plugin.nativeVisitors) continue;
    actual.push(name);
    const register = referenceVisitorRegistry.get(name);
    assert.ok(register, name);
    let count = 0;
    register({ ctx: context(), registerVisitor: () => count++, registeredPlugins: new Set() });
    assert.equal(plugin.nativeVisitors.length, count, name);
  }
  assert.deepEqual(actual.sort(), [...referenceVisitorRegistry.keys()].sort());
});

test('Native visitor plans preserve workspace registration and duplicate factory order', () => {
  const plugins = new Set<PluginName>(['vitest', 'stencil', 'rspack', 'jest', 'webpack', 'angular']);
  plugins.add('vitest');
  assert.deepEqual(getNativeVisitorPlan(plugins), [
    'bun-shell',
    'vitest',
    'stencil-custom-elements',
    'stencil-style-urls',
    'webpack',
    'jest',
    'webpack',
    'angular-style-urls',
  ]);
  assert.deepEqual(getNativeVisitorPlan([]), ['bun-shell']);
});

const source = `
import { $ } from 'bun';
import { execa } from 'execa';
import spawn from 'nano-spawn';
import { $ as zx } from 'zx';
import { jest } from '@jest/globals';
import { vi } from 'vitest';
import { rs } from '@rstest/core';
import { glob } from 'node:fs/promises';
import knex from 'knex';
import pino from 'pino';
import { customElement } from 'lit/decorators.js';
import { customElement as fastElement } from '@microsoft/fast-element';
import { controller } from '@github/catalyst';
import { Component } from '@stencil/core';
import { Component as AngularComponent } from '@angular/core';
$\`node ./bun-script.js\`;
execa('node', ['./execa-script.js']);
spawn('node', ['./spawn-script.js']);
zx\`node ./zx-script.js\`;
jest.mock('./jest-module.ts');
vi.mock('./vitest-module.ts');
rs.mock('./rstest-module.ts');
import.meta.glob('./vite/*.ts');
require.context('./webpack', true, /\\.ts$/);
glob('./node/*.ts');
knex({ client: 'pg' });
pino.transport({ target: 'pino-pretty' });
@customElement('lit-card') export class LitCard {}
@fastElement('fast-card') export class FastCard {}
@controller export class CatalystCard {}
@Component({ tag: 'stencil-card', styleUrls: ['./stencil.css'] }) export class StencilCard {}
@AngularComponent({ styleUrls: ['./angular.css'] }) export class AngularCard {}
`;

const options: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: true,
  isFixTypes: true,
  isReportExports: true,
  tags: [[], []],
};
const resolver: ResolveModule = (specifier, file) => ({
  resolvedFileName: resolve(dirname(file), specifier),
  isExternalLibraryImport: !specifier.startsWith('.'),
});
const ordered = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (item instanceof Map || item instanceof Set) return [...item];
      if (item instanceof RegExp) return { source: item.source, flags: item.flags };
      return item;
    })
  );

test('Native metadata matches the original factory registry across workspace order and deduplication', () => {
  const all: PluginName[] = [];
  for (const [name] of PluginEntries) if (referenceVisitorRegistry.has(name)) all.push(name);
  const campaigns: PluginName[][][] = [
    [all],
    [all.toReversed()],
    [['rspack', 'stencil', 'vitest'], ['webpack', 'vitest', 'stencil', 'angular'], all],
    [['angular', 'webpack', 'jest'], ['rspack', 'stencil', 'jest'], all.toReversed()],
  ];
  for (const workspaces of campaigns) {
    const ctx = context();
    const visitors: PluginVisitorObject[] = [createBunShellVisitor(ctx)];
    const registeredPlugins = new Set<PluginName>();
    for (const plugins of workspaces) {
      for (const name of plugins) {
        if (registeredPlugins.has(name)) continue;
        const register = referenceVisitorRegistry.get(name);
        if (!register) continue;
        registeredPlugins.add(name);
        register({ ctx, registeredPlugins, registerVisitor: visitor => visitors.push(visitor) });
      }
    }
    const file = resolve('fixtures/visitor-registry.ts');
    const expected = _getImportsAndExports(
      file,
      source,
      resolver,
      options,
      true,
      false,
      buildVisitor(visitors, true),
      ctx
    );
    const actual = nativeGetImportsAndExports(
      file,
      source,
      resolver,
      options,
      true,
      false,
      getNativeVisitorPlan(registeredPlugins)
    );
    assert.deepEqual(
      ordered({ ...actual, duplicates: [...actual.duplicates] }),
      ordered({ ...expected, duplicates: [...expected.duplicates] }),
      JSON.stringify(workspaces)
    );
  }
});

test('A plugin without native visitors fails explicitly', () => {
  assert.throws(() => getNativeVisitorPlan(['babel']), /babel/);
});
