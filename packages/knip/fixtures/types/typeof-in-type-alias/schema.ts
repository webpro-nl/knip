export const PRESETS = ['today', 'last7Days'] as const;

export const DAYS = ['mon', 'tue', 'wed'] as const;

export const SHAPE = { width: 1, height: 1 };

export type DatePreset = (typeof PRESETS)[number];

export type Day = typeof DAYS;

export type Wrap = { size: typeof SHAPE };
