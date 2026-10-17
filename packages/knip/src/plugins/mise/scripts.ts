import { type Command, forEachChild, parse, type Script, type SyntaxNode } from 'unbash';
import { getDependenciesFromCommand, getInputsFromNodeOptions } from '../../binaries/command.ts';
import { spawningBinaries } from '../../binaries/fallback.ts';
import { isWrapper } from '../../binaries/plugins.ts';
import { isPackageManager } from '../../binaries/resolvers/index.ts';
import { toScript } from '../../binaries/util.ts';
import { SCRIPT_INTERPOLATION } from '../../constants.ts';
import type { FromArgs, GetInputsFromScriptsOptions, GetInputsFromScriptsPartial } from '../../types/config.ts';
import { type Input, isBinary } from '../../util/input.ts';
import { extractBinary, isRelativeNodeModulesBin } from '../../util/modules.ts';
import { isScriptExpansion, collectCommands } from '../../util/scripts.ts';

type Options = GetInputsFromScriptsOptions & {
  getInputsFromScripts: GetInputsFromScriptsPartial;
};

export const getInputsFromMiseScript = (script: string, options: Options, hasLocalBinPath: boolean): Input[] => {
  const inputs: Input[] = [];
  const definedFunctions = new Set<string>();

  // The command's source with each substitution replaced by the interpolation marker; substitution scripts are
  // read as mise scripts of their own, wherever they occur
  const readCommand = (command: Command, source: string): string => {
    let text = '';
    let cursor = command.pos;
    const visit = (node: SyntaxNode) => {
      if (!isScriptExpansion(node)) {
        forEachChild(node, visit);
        return;
      }
      if (node.script) readScript(node.script, node.script.source ?? source);
      if (node.pos >= cursor && node.end <= command.end) {
        text += source.slice(cursor, node.pos) + SCRIPT_INTERPOLATION;
        cursor = node.end;
      }
    };
    forEachChild(command, visit);
    return text + source.slice(cursor, command.end);
  };

  const readScript = (parsed: Script, source: string) => {
    for (const statement of parsed.commands) {
      if (statement.command.type === 'Function') definedFunctions.add(statement.command.name.value);
    }

    for (const command of collectCommands(parsed)) {
      const text = readCommand(command, source);
      const name = command.name?.value;
      if (!name || definedFunctions.has(name)) continue;

      const binary = extractBinary(name);
      const isPackageCommand = isPackageManager(binary);
      const isExplicit = isPackageCommand || name.startsWith('./') || isRelativeNodeModulesBin(name);
      const hasPath = command.prefix.some(item => item.type === 'Assignment' && item.name === 'PATH');
      const isLocal = hasLocalBinPath && !hasPath;
      const isWrapperCommand = !isPackageCommand && isWrapper(binary);
      if (!isExplicit && !isLocal && !isWrapperCommand && binary !== 'node' && binary !== 'find') continue;

      let commandInputs: Input[];
      if (isWrapperCommand || binary === 'find') {
        const [marked] = collectCommands(parse(text));
        if (!marked) continue;
        const fromScript = (script: string): Input[] => {
          inputs.push(...getInputsFromMiseScript(script, options, isLocal));
          return [];
        };
        const fromArgs: FromArgs = args => fromScript(toScript(args));
        commandInputs = getDependenciesFromCommand(marked, { ...options, fromArgs });
        if (spawningBinaries.includes(binary)) commandInputs.push(...getInputsFromNodeOptions(marked.prefix));
      } else {
        commandInputs = options.getInputsFromScripts(text, { cwd: options.cwd, manifest: options.manifest });
      }

      if (!isExplicit && !isLocal && binary !== 'node' && binary !== 'find') continue;

      const binaryInput = commandInputs.find(input => isBinary(input) && input.specifier === binary);
      if (!isExplicit && isLocal && binaryInput) binaryInput.optional = true;
      for (const input of commandInputs) {
        if (!input.specifier || input.specifier.includes(SCRIPT_INTERPOLATION)) continue;
        if (!isExplicit && !isLocal && input === binaryInput) continue;
        inputs.push(input);
      }
    }
  };

  try {
    readScript(parse(script), script);
  } catch {
    return [];
  }

  return inputs;
};
