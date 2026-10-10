import { type Assignment, parse, type Script, type Word, type WordPart } from 'unbash';
import { getDependenciesFromCommand, getInputsFromNodeOptions } from '../../binaries/command.ts';
import { spawningBinaries } from '../../binaries/fallback.ts';
import { isWrapper } from '../../binaries/plugins.ts';
import { isPackageManager } from '../../binaries/resolvers/index.ts';
import { toScript } from '../../binaries/util.ts';
import { SCRIPT_INTERPOLATION } from '../../constants.ts';
import type { FromArgs, GetInputsFromScriptsOptions, GetInputsFromScriptsPartial } from '../../types/config.ts';
import { type Input, isBinary } from '../../util/input.ts';
import { extractBinary, isRelativeNodeModulesBin } from '../../util/modules.ts';
import { walkCommands } from '../../util/scripts.ts';

type Options = GetInputsFromScriptsOptions & {
  getInputsFromScripts: GetInputsFromScriptsPartial;
};

export const getInputsFromMiseScript = (script: string, options: Options, hasLocalBinPath: boolean): Input[] => {
  const inputs: Input[] = [];
  const definedFunctions = new Set<string>();

  const readParts = (parts: readonly WordPart[]): { text: string; value: string; hasExpansion: boolean } => {
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
    return hasExpansion ? { type: 'Word', pos: word.pos, end: word.end, text, value } : word;
  };

  const readAssignment = (assignment: Assignment): Assignment => {
    const original = assignment.value;
    const value: Assignment['value'] =
      original.type === 'Word'
        ? readWord(original)
        : { type: 'ArrayValue', pos: original.pos, end: original.end, elements: original.elements.map(readWord) };
    if (value === original) return assignment;
    const text = value.type === 'Word' ? value.text : `(${value.elements.map(word => word.text).join(' ')})`;
    return {
      type: 'Assignment',
      pos: assignment.pos,
      end: assignment.end,
      name: assignment.name,
      index: assignment.index,
      append: assignment.append,
      value,
      text: assignment.text.slice(0, original.pos - assignment.pos) + text,
    };
  };

  const readScript = (parsed: Script) => {
    for (const statement of parsed.commands) {
      if (statement.command.type === 'Function') definedFunctions.add(statement.command.name.value);
    }

    for (const statement of parsed.commands) {
      for (const command of walkCommands(statement.command)) {
        const name = command.name?.value;
        const word = command.name && readWord(command.name);
        const prefix = command.prefix
          .filter((item): item is Assignment => item.type === 'Assignment')
          .map(readAssignment);
        const words: Word[] = [];
        for (const arg of command.args) {
          if (arg.type === 'Word') words.push(readWord(arg));
          else readAssignment(arg);
        }
        if (!name || !word || definedFunctions.has(name)) continue;

        const binary = extractBinary(name);
        const isPackageCommand = isPackageManager(binary);
        const isExplicit = isPackageCommand || name.startsWith('./') || isRelativeNodeModulesBin(name);
        const isLocal = hasLocalBinPath && !prefix.some(assignment => assignment.name === 'PATH');
        const isWrapperCommand = !isPackageCommand && isWrapper(binary);
        if (!isExplicit && !isLocal && !isWrapperCommand && binary !== 'node' && binary !== 'find') continue;

        let commandInputs: Input[];
        if (isWrapperCommand || binary === 'find') {
          const fromScript = (script: string): Input[] => {
            inputs.push(...getInputsFromMiseScript(script, options, isLocal));
            return [];
          };
          const fromArgs: FromArgs = args => fromScript(toScript(args));
          commandInputs = getDependenciesFromCommand({ name: word, prefix, args: words }, { ...options, fromArgs });
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
