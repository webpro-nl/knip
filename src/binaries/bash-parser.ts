import Parser from 'tree-sitter';
import Bash from 'tree-sitter-bash';
import { debugLogObject } from '../util/debug.js';
import { stripQuotes } from '../util/string.js';
import * as FallbackResolver from './resolvers/fallback.js';
import * as KnownResolvers from './resolvers/index.js';
import { stripBinaryPath } from './util.js';
import type { PackageJson } from '@npmcli/package-json';
import type { SyntaxNode } from 'tree-sitter';

type KnownResolver = keyof typeof KnownResolvers;

const parser = new Parser();
parser.setLanguage(Bash);

const getCommandsFromScript = (script: string) => {
  const tree = parser.parse(script);
  const commands: string[][] = [];

  const traverse = (node: SyntaxNode) => {
    switch (node.type) {
      case 'command': {
        const commandNameIndex = node.children.findIndex(node => node.type === 'command_name');
        const command = node.children
          .slice(commandNameIndex)
          .map(node => node.text)
          .map(stripQuotes);
        commands.push(command);
        break;
      }
      default:
        break;
    }

    for (const child of node.children) {
      traverse(child);
    }
  };

  traverse(tree.rootNode);

  return commands;
};

export const getBinariesFromScript = (
  script: string,
  { cwd, manifest, knownGlobalsOnly = false }: { cwd: string; manifest: PackageJson; knownGlobalsOnly?: boolean }
): string[] => {
  if (!script) return [];

  // Helper for recursive calls
  const fromArgs = (args: string[]) =>
    getBinariesFromScript(stripQuotes(args.filter(arg => arg !== '--').join(' ')), { cwd, manifest });

  const commands = getCommandsFromScript(script);

  const getBinariesFromCommand = (command: string[]) => {
    const [bin, ...args] = command;
    const binary = stripBinaryPath(bin);

    if (!binary || binary === '.' || binary === 'source') return [];
    if (binary.startsWith('-') || binary.startsWith('"') || binary.startsWith('..')) return [];
    if (['bun', 'deno'].includes(binary)) return [];

    if (binary in KnownResolvers) {
      return KnownResolvers[binary as KnownResolver].resolve(binary, args, { cwd, manifest, fromArgs });
    }

    // Before using the fallback resolver, we need a way to bail out for scripts in environments like GitHub
    // Actions, which are provisioned with lots of unknown global binaries.
    if (knownGlobalsOnly) return [];

    // We apply a kitchen sink fallback resolver for everything else
    return FallbackResolver.resolve(binary, args, { cwd, manifest, fromArgs });
  };

  try {
    return commands.map(getBinariesFromCommand).flat();
  } catch (error) {
    debugLogObject('Bash parser error', error);
    return [];
  }
};
