import { readFileSync } from 'node:fs';
import { collectStringLiterals } from '../typescript/ast-helpers.ts';
import { type Input, isDeferResolve, isDependency } from './input.ts';
import { getPackageNameFromSpecifier } from './modules.ts';
import { dirname, isInternal, join } from './path.ts';

const readFile = (filePath: string): string | undefined => {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
};

export const filterTransitiveDependencies = (
  inputs: Input[],
  configFilePath: string,
  readRawFile: (filePath: string) => string | undefined = readFile
) => {
  const literals = new Set<string>();
  const visited = new Set<string>();
  const collect = (filePath: string) => {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    const sourceText = readRawFile(filePath);
    if (!sourceText) return;
    for (const literal of collectStringLiterals(sourceText, filePath)) {
      literals.add(literal);
      if (isInternal(literal)) collect(join(dirname(filePath), literal));
    }
  };
  collect(configFilePath);
  for (const input of inputs) {
    if (!input.optional && (isDeferResolve(input) || isDependency(input))) {
      const name = getPackageNameFromSpecifier(input.specifier);
      if (name && !literals.has(name)) input.optional = true;
    }
  }
};
