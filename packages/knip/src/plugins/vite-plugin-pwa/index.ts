import { Visitor } from 'oxc-parser';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { getImportMap, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://vite-pwa-org.netlify.app

const title = 'vite-plugin-pwa';

const enablers = ['vite-plugin-pwa'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const defaultSrcDir = 'public';
const defaultFilename = 'sw.js';

const production = [join(defaultSrcDir, defaultFilename)];

const resolveFromAST: ResolveFromAST = (program, options) => {
  const names = new Set(
    Array.from(getImportMap(program))
      .filter(([, path]) => path === 'vite-plugin-pwa')
      .map(([name]) => name)
  );
  if (names.size === 0) return [];

  const inputs: Input[] = [];
  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee?.type !== 'Identifier' || !names.has(node.callee.name)) return;
      const opts = node.arguments?.[0];
      if (!getPropertyValues(opts, 'strategies').has('injectManifest')) return;
      const srcDir = Array.from(getPropertyValues(opts, 'srcDir'))[0] ?? defaultSrcDir;
      const filename = Array.from(getPropertyValues(opts, 'filename'))[0] ?? defaultFilename;
      inputs.push(toProductionEntry(join(options.configFileDir, srcDir, filename)));
    },
  });
  visitor.visit(program);
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
