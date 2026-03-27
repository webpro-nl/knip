import type { Program } from 'oxc-parser';
import { collectPropertyValues, hasImportSpecifier } from '../../typescript/ast-helpers.ts';

export const getSrcDir = (program: Program): string => {
  const values = collectPropertyValues(program, 'srcDir');
  return values.size > 0 ? Array.from(values)[0] : 'src';
};

export const usesPassthroughImageService = (program: Program) =>
  hasImportSpecifier(program, 'astro/config', 'passthroughImageService');
