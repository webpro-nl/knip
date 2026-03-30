import type { Program } from 'oxc-parser';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';

export const getPageExtensions = (program: Program) => Array.from(collectPropertyValues(program, 'pageExtensions'));
