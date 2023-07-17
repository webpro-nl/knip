import parseArgs from 'minimist';
import { isInternal } from '../../util/path.js';
import { fromBinary, toBinary } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { fromArgs, manifest }) => {
  const parsed = parseArgs(args, {
    '--': true,
    stopEarly: true,
    boolean: ['yes', 'no'],
    alias: { yes: 'y', no: 'no-install' },
  });
  const leftParsed = fromArgs(parsed._);
  const leftHandCommand = parsed.yes ? leftParsed.slice(1) : leftParsed; // Only explicit `npx --yes dep` indicates package should not be in deps
  const rightHandCommand = parsed['--'] ? fromArgs(parsed['--']) : [];

  // Distinguish binary versus packages based on presence in (dev)Dependencies, also binaries are not files and don't
  // start with `@`. TODO: `pkg@1.0.0` notation also indicates package name, but that information is kinda lost.
  const binaryOrPackageName = fromBinary(leftHandCommand[0] ?? rightHandCommand[0]);
  const dependencies = manifest
    ? [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})]
    : [];
  const dependency =
    !binaryOrPackageName.startsWith('@') &&
    !isInternal(binaryOrPackageName) &&
    !dependencies.includes(binaryOrPackageName)
      ? toBinary(binaryOrPackageName)
      : binaryOrPackageName;

  return [dependency, ...leftHandCommand.slice(1), ...rightHandCommand];
};
