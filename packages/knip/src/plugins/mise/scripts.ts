import { parse, type Script, type Word, type WordPart } from 'unbash';
import { getDependenciesFromCommand, getInputsFromNodeOptions } from '../../binaries/command.ts';
import { spawningBinaries } from '../../binaries/fallback.ts';
import { isWrapper } from '../../binaries/plugins.ts';
import KnownResolvers from '../../binaries/resolvers/index.ts';
import { toScript } from '../../binaries/util.ts';
import { SCRIPT_INTERPOLATION } from '../../constants.ts';
import type { FromArgs, GetInputsFromScriptsOptions, GetInputsFromScriptsPartial } from '../../types/config.ts';
import { type Input, isBinary } from '../../util/input.ts';
import { extractBinary } from '../../util/modules.ts';
import { walkCommands } from '../../util/scripts.ts';

type Options = GetInputsFromScriptsOptions & {
  getInputsFromScripts: GetInputsFromScriptsPartial;
};

export const getInputsFromMiseScript = (script: string, options: Options, hasLocalBinPath: boolean): Input[] => {
  const inputs: Input[] = [];
  const definedFunctions = new Set<string>();

  const readParts = (parts: WordPart[]): { text: string; value: string; hasExpansion: boolean } => {
    let text = '';
    let value = '';
    let hasExpansion = false;
    for (const part of parts) {
      if (part.type === 'CommandExpansion' || part.type === 'ProcessSubstitution') {
        if (part.script) readScript(part.script);
        text += SCRIPT_INTERPOLATION;
        value += SCRIPT_INTERPOLATION;
        hasExpansion = true;
      } else if (part.type === 'DoubleQuoted' || part.type === 'LocaleString') {
        const inner = readParts(part.parts);
        text += `${part.type === 'LocaleString' ? '$"' : '"'}${inner.text}"`;
        value += inner.value;
        if (inner.hasExpansion) hasExpansion = true;
      } else {
        text += part.text;
        value += 'value' in part ? part.value : part.text;
      }
    }
    return { text, value, hasExpansion };
  };

  const readWord = (word: Word): Word => {
    if (!word.parts) return word;
    const { text, value, hasExpansion } = readParts(word.parts);
    return hasExpansion ? { ...word, text, value } : word;
  };

  const readScript = (parsed: Script) => {
    for (const statement of parsed.commands) {
      if (statement.command.type === 'Function') definedFunctions.add(statement.command.name.value);
    }

    for (const statement of parsed.commands) {
      for (const command of walkCommands(statement.command)) {
        const name = command.name?.value;
        const word = command.name && readWord(command.name);
        const prefix = command.prefix.map(assignment => {
          const value = assignment.value && readWord(assignment.value);
          return value && value !== assignment.value
            ? { ...assignment, value, text: `${assignment.name}=${value.text}` }
            : assignment;
        });
        const words = command.suffix.map(readWord);
        if (!name || !word || definedFunctions.has(name)) continue;

        const binary = extractBinary(name);
        const isPackageManager = binary in KnownResolvers && binary !== 'find';
        const isExplicit = isPackageManager || name.startsWith('./') || /^(?:\.\.?\/)*node_modules\/\.bin\//.test(name);
        const isLocal = hasLocalBinPath && !command.prefix.some(assignment => assignment.name === 'PATH');
        const isWrapperCommand = !isPackageManager && isWrapper(binary);
        if (!isExplicit && !isLocal && !isWrapperCommand && binary !== 'node' && binary !== 'find') continue;

        let commandInputs: Input[];
        if (isWrapperCommand || binary === 'find') {
          const fromScript = (script: string): Input[] => {
            inputs.push(...getInputsFromMiseScript(script, options, isLocal));
            return [];
          };
          const fromArgs: FromArgs = args => fromScript(toScript(args));
          commandInputs = getDependenciesFromCommand(
            { ...command, name: word, prefix, suffix: words },
            { ...options, fromArgs }
          );
        } else {
          commandInputs = options.getInputsFromScripts(
            [...prefix.map(assignment => assignment.text), word.text, ...words.map(word => word.text)].join(' '),
            { cwd: options.cwd, manifest: options.manifest }
          );
        }

        if (!isExplicit && !isLocal && binary !== 'node' && binary !== 'find') continue;
        if (isWrapperCommand && spawningBinaries.includes(binary)) {
          commandInputs.push(...getInputsFromNodeOptions(prefix));
        }

        const binaryInput = commandInputs.find(input => isBinary(input) && input.specifier === binary);
        if (!isExplicit && isLocal && binaryInput) binaryInput.optional = true;
        for (const input of commandInputs) {
          if (!input.specifier || input.specifier.includes(SCRIPT_INTERPOLATION)) continue;
          if (!isExplicit && !isLocal && input === binaryInput) continue;
          inputs.push(input);
        }
      }
    }
  };

  try {
    readScript(parse(script));
  } catch {
    return [];
  }

  return inputs;
};
