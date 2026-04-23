import type { DatePreset, Day, Wrap } from './schema.ts';

export const a: DatePreset = 'today';

export const b: Day = ['mon', 'tue', 'wed'] as const;

export const c: Wrap = { size: { width: 2, height: 2 } };
