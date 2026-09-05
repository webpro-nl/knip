import.meta.glob('./shapes/*.vue');

import.meta.glob(['./animals/*.ts', '!./animals/cat.ts', './flowers/**/*.astro']);

import { usedExport } from './raw/used.ts';

usedExport();

import.meta.glob('./raw/*.ts', { query: '?raw' });
import.meta.glob('./raw/*.ts', { as: 'raw' });
