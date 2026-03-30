import * as CONSTANTS from '@knip-ls/shared';
import { multiply } from '@knip-ls/shared';

CONSTANTS.TEXT;

multiply(1, 2);

const [{ APPLE }, { BANANA }, { CHERRY }] = await Promise.all([
  import('@knip-ls/shared/fruits'),
  import('@knip-ls/shared/fruits'),
  import('@knip-ls/shared/fruits'),
]);

export const FRUITS = [APPLE, BANANA, CHERRY];
