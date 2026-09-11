import { Visitor } from 'oxc-parser';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getFirstPropertyValue, getStringValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isFile } from '../../util/fs.ts';
import type { Input } from '../../util/input.ts';
import { join } from '../../util/path.ts';

// https://docs.railway.com/infrastructure-as-code

const title = 'Railway';

const enablers = 'This plugin is enabled when `.railway/railway.ts` is found.';

const isEnabled: IsPluginEnabled = ({ cwd }) => isFile(cwd, '.railway/railway.ts');

const config = ['.railway/railway.ts'];

const args: Args = {
  resolve: ['file', 'runner'],
};

const getCommands = (node: unknown): string[] => {
  const command = getStringValue(node);
  return command ? [command] : [...getStringValues(node)];
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  const serviceNames = new Set<string>();

  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration' || getStringValue(node.source) !== 'railway/iac') continue;
    for (const specifier of node.specifiers) {
      if (
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.type === 'Identifier' &&
        specifier.imported.name === 'service'
      ) {
        serviceNames.add(specifier.local.name);
      }
    }
  }

  const inputs: Input[] = [];
  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || !serviceNames.has(node.callee.name)) return;

      const serviceConfig = node.arguments[1];
      if (serviceConfig?.type !== 'ObjectExpression') return;

      const source = findProperty(serviceConfig, 'source');
      const sourceConfig = source?.type === 'CallExpression' ? source.arguments[1] : source;
      const rootDirectory =
        getFirstPropertyValue(sourceConfig, 'rootDirectory') ??
        getFirstPropertyValue(serviceConfig, 'root') ??
        getFirstPropertyValue(serviceConfig, 'rootDirectory');
      const cwd = rootDirectory ? join(options.cwd, rootDirectory) : options.cwd;
      const manifest = options.getManifest(cwd) ?? options.manifest;

      const build = findProperty(serviceConfig, 'build');
      const commands = [
        ...getCommands(build),
        ...getCommands(findProperty(build, 'buildCommand')),
        ...getCommands(findProperty(serviceConfig, 'start')),
        ...getCommands(findProperty(serviceConfig, 'preDeploy')),
        ...getCommands(findProperty(findProperty(serviceConfig, 'deploy'), 'preDeployCommand')),
      ];

      for (const input of options.getInputsFromScripts(commands, { knownBinsOnly: true, cwd, manifest })) {
        inputs.push({ ...input, dir: cwd });
      }
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
  args,
  resolveFromAST,
};

export default plugin;
