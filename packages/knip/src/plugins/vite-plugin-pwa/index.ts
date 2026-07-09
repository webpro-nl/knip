import { Visitor } from 'oxc-parser';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://vite-pwa-org.netlify.app

const title = 'vite-plugin-pwa';

const enablers = ['vite-plugin-pwa', '@vite-pwa/nuxt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}', 'nuxt.config.{js,cjs,mjs,ts,cts,mts}'];

const defaultSrcDir = 'public';
const defaultFilename = 'sw.js';

const production = [join(defaultSrcDir, defaultFilename)];

const isNuxtConfig = (configFileName: string) => configFileName.startsWith('nuxt.config.');

const getInjectManifestEntry = (options: any, configFileDir: string): Input | undefined => {
  if (!getPropertyValues(options, 'strategies').has('injectManifest')) return;
  const srcDir = Array.from(getPropertyValues(options, 'srcDir'))[0] ?? defaultSrcDir;
  const filename = Array.from(getPropertyValues(options, 'filename'))[0] ?? defaultFilename;
  return toProductionEntry(join(configFileDir, srcDir, filename));
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  const inputs: Input[] = [];

  if (isNuxtConfig(options.configFileName)) {
    const visitor = new Visitor({
      ObjectExpression(node) {
        const pwa = findProperty(node, 'pwa');
        if (pwa?.type !== 'ObjectExpression') return;
        const entry = getInjectManifestEntry(pwa, options.configFileDir);
        if (entry) inputs.push(entry);
      },
    });
    visitor.visit(program);
    return inputs;
  }

  const names = new Set(
    Array.from(getImportMap(program))
      .filter(([, path]) => path === 'vite-plugin-pwa')
      .map(([name]) => name)
  );
  if (names.size === 0) return inputs;

  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee?.type !== 'Identifier' || !names.has(node.callee.name)) return;
      const entry = getInjectManifestEntry(node.arguments?.[0], options.configFileDir);
      if (entry) inputs.push(entry);
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
