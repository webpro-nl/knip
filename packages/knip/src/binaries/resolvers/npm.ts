import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { isBinary, toBinary, toDependency } from '../../util/input.ts';
import { extractBinary, isValidBinary, stripVersionFromSpecifier } from '../../util/modules.ts';
import { isInternal } from '../../util/path.ts';
import { argsAfter, expandScript } from '../util.ts';

export const resolve: BinaryResolver = (_binary, words, options) => {
  const { fromArgs, manifest } = options;
  const parsed = parseArgs(words, {
    isStorePositions: true,
    boolean: ['yes', 'no', 'parseable'],
    string: ['package', 'call'],
    alias: { yes: 'y', parseable: 'p', call: 'c' },
    '--': true,
  });
  const [command, script] = parsed._;
  if (command === 'exec' || command === 'x') {
    const packages = parsed.package ? [parsed.package].flat() : [];
    const packageInputs = packages.map(specifier =>
      toDependency(stripVersionFromSpecifier(specifier), { optional: true })
    );
    const separator = words.findIndex(word => word.value === '--');
    const args = parsed.positionalIndices!.slice(1).map(index => words[index]);
    if (separator !== -1) args.push(...words.slice(separator + 1));

    const call = Array.isArray(parsed.call) ? parsed.call.at(-1) : parsed.call;
    if (call) return packages.length ? packageInputs : fromArgs([call]);
    const specifier = args[0]?.value;
    if (!specifier) return packageInputs;

    const npmWords = separator === -1 ? words : words.slice(0, separator);
    const noInstall = parsed.no || npmWords.some(word => word.value === '--yes=false' || word.value === '--no-yes');
    const inputOptions = noInstall && packages.length === 0 ? undefined : { optional: true };
    const isPackage = packages.length === 0 && specifier.includes('@') && !isInternal(specifier);
    if (isPackage && specifier.startsWith('@')) {
      return [toDependency(stripVersionFromSpecifier(specifier), inputOptions)];
    }

    const inputs = fromArgs([args.map(word => word.text).join(' ')]);
    const first = inputs[0];
    if (first && isBinary(first) && first.specifier === extractBinary(specifier)) {
      if (isPackage) inputs[0] = toDependency(stripVersionFromSpecifier(specifier), inputOptions);
      else if (inputOptions) first.optional = true;
    } else if (isPackage || (!isInternal(specifier) && !specifier.includes('/') && isValidBinary(specifier))) {
      inputs.unshift(
        isPackage
          ? toDependency(stripVersionFromSpecifier(specifier), inputOptions)
          : toBinary(extractBinary(specifier), inputOptions)
      );
    }
    return [...packageInputs, ...inputs];
  }

  const _childArgs =
    parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--'), { isForwardedArgs: true }) : [];
  if (command === 'run' && manifest.scriptNames.has(script)) {
    return expandScript(script, argsAfter(words, '--'), manifest.scripts, options) ?? _childArgs;
  }
  return [];
};
