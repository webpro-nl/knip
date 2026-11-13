import type { Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import {
  findProperty,
  getFirstPropertyValue,
  getStringValues,
  resolveObjectArg,
} from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toDependency, toEntryPath, toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';

const sourceFilesEntries: [string, string[]][] = [
  ['rootComponent', ['src/App.vue']],
  ['router', ['src/router/index.{js,ts}']],
  ['store', ['src/stores/index.{js,ts}', 'src/store/index.{js,ts}']],
  ['pwaRegisterServiceWorker', ['src-pwa/register-service-worker.{js,ts}', 'src-pwa/register-sw.{js,ts}']],
  ['pwaServiceWorker', ['src-pwa/custom-service-worker.{js,ts}', 'src-pwa/sw/custom-sw.{js,ts}']],
  ['electronMain', ['src-electron/electron-main.{js,ts}']],
];

const staticEntries = [
  'src-electron/electron-preload.{js,ts}',
  'src-ssr/server.{js,ts}',
  'src-ssr/middlewares/*.{js,ts}',
  'src-bex/**/*.{js,ts}',
];

export const production = [...sourceFilesEntries.flatMap(([, defaults]) => defaults), ...staticEntries];

const getConfigObject = (program: Program) => {
  for (const node of (program as unknown as { body: any[] }).body ?? []) {
    if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration;
      return decl?.type === 'CallExpression' ? resolveObjectArg(decl.arguments?.[0]) : resolveObjectArg(decl);
    }
    if (node.type === 'ExpressionStatement' && node.expression?.type === 'AssignmentExpression') {
      const { left, right } = node.expression;
      if (left?.type === 'MemberExpression' && left.object?.name === 'module' && left.property?.name === 'exports') {
        return right?.type === 'CallExpression' ? resolveObjectArg(right.arguments?.[0]) : resolveObjectArg(right);
      }
    }
  }
};

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const { configFileDir } = options;
  const inputs: Input[] = [];
  const config = getConfigObject(program);

  const sourceFiles = findProperty(config, 'sourceFiles');
  for (const [key, defaults] of sourceFilesEntries) {
    const override = getFirstPropertyValue(sourceFiles, key);
    if (override) inputs.push(toEntryPath(join(configFileDir, override), { production: true }));
    else for (const id of defaults) inputs.push(toEntry(join(configFileDir, id), { production: true }));
  }
  for (const id of staticEntries) inputs.push(toEntry(join(configFileDir, id), { production: true }));

  const boot = findProperty(config, 'boot');
  if (boot?.type === 'ArrayExpression') {
    for (const element of boot.elements ?? []) {
      const id = getStringValue(element) ?? getFirstPropertyValue(element, 'path');
      if (!id) continue;
      if (id.startsWith('~')) inputs.push(toDependency(id.slice(1)));
      else inputs.push(toEntryPath(join(configFileDir, 'src/boot', id), { production: true }));
    }
  }

  for (const id of getStringValues(findProperty(config, 'css'))) {
    if (id.startsWith('~')) inputs.push(toDependency(id.slice(1)));
    else inputs.push(toEntryPath(join(configFileDir, 'src/css', id), { production: true }));
  }

  return inputs;
};
