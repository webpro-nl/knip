import type { Expression } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getFirstPropertyValue, getStringValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isFile } from '../../util/fs.ts';
import { getGitRemoteUrls } from '../../util/git.ts';
import { isEntry, type Input } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';

// https://docs.railway.com/infrastructure-as-code

const title = 'Railway';

const enablers = 'This plugin is enabled when `.railway/railway.ts` is found.';

const isEnabled: IsPluginEnabled = ({ cwd }) => isFile(cwd, '.railway/railway.ts');

const config = ['.railway/railway.ts'];

const args: Args = {
  config: ['file'],
  resolve: ['runner'],
};

const getCommands = (node: unknown): string[] => {
  const command = getStringValue(node);
  return command ? [command] : [...getStringValues(node)];
};

const isExternalSourceType = (type: string | undefined) => type === 'github' || type === 'image' || type === 'template';

const getGitHubRepository = (value: string | undefined) => {
  const normalized = value
    ?.trim()
    .replace(/^git\+/, '')
    .replace(/\.git\/?$/, '')
    .replace(/\/$/, '');
  return normalized?.match(/(?:^|github(?:\.com)?[/:])([^/:]+\/[^/]+)$/i)?.[1].toLowerCase();
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  const serviceNames = new Set<string>();
  const sourceTypes = new Map<string, string>();
  const bindings = new Map<string, Expression>();
  const localRepositories = new Set<string>();

  for (const repository of [options.manifest.repository, options.rootManifest?.repository]) {
    const name = getGitHubRepository(typeof repository === 'string' ? repository : repository?.url);
    if (name) localRepositories.add(name);
  }
  for (const url of getGitRemoteUrls(options.rootCwd)) {
    const name = getGitHubRepository(url);
    if (name) localRepositories.add(name);
  }

  for (const node of program.body) {
    if (node.type === 'ImportDeclaration' && getStringValue(node.source) === 'railway/iac') {
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') continue;
        if (specifier.imported.name === 'service') serviceNames.add(specifier.local.name);
        if (isExternalSourceType(specifier.imported.name)) {
          sourceTypes.set(specifier.local.name, specifier.imported.name);
        }
      }
    } else if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        if (declaration.id.type === 'Identifier' && declaration.init)
          bindings.set(declaration.id.name, declaration.init);
      }
    }
  }

  const resolveBinding = (node: Expression | undefined): Expression | undefined => {
    const seen = new Set<string>();
    while (node?.type === 'Identifier' && bindings.has(node.name) && !seen.has(node.name)) {
      seen.add(node.name);
      node = bindings.get(node.name);
    }
    return node;
  };

  const inputs: Input[] = [];
  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || !serviceNames.has(node.callee.name)) return;

      const serviceConfig = node.arguments[1];
      if (serviceConfig?.type !== 'ObjectExpression') return;

      const source = resolveBinding(findProperty(serviceConfig, 'source'));
      const repository = getFirstPropertyValue(source, 'repo');
      const image = getFirstPropertyValue(source, 'image');
      const template = getFirstPropertyValue(source, 'template');
      const sourceType =
        (source?.type === 'CallExpression' && source.callee.type === 'Identifier'
          ? sourceTypes.get(source.callee.name)
          : undefined) ??
        getFirstPropertyValue(source, 'type') ??
        (repository ? 'github' : image ? 'image' : template ? 'template' : undefined);
      const sourceRepository = getGitHubRepository(
        source?.type === 'CallExpression' ? getStringValue(source.arguments[0]) : repository
      );
      if (
        sourceType === 'image' ||
        sourceType === 'template' ||
        (sourceType === 'github' &&
          sourceRepository !== undefined &&
          localRepositories.size > 0 &&
          !localRepositories.has(sourceRepository))
      ) {
        return;
      }

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

      const scriptOptions = { optionalBinaries: true, cwd, manifest };
      for (const input of options.getInputsFromScripts(commands, scriptOptions)) {
        if (isEntry(input)) input.specifier = toAbsolute(input.specifier, cwd);
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
