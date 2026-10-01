// NOT strictly NS: mixed usage (spread + member access)
import * as Colors from './colors.js';

export const allColors = { ...Colors };
export const justRed = Colors.red;
