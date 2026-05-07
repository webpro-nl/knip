import type { Fruit } from '@fixtures/workspaces-type-only-dev-dependencies__types';
import type { Vegetable } from '@fixtures/workspaces-type-only-dev-dependencies__prod-types';
import { runtime } from '@fixtures/workspaces-type-only-dev-dependencies__runtime';

export const fruit: Fruit = 'apple';
export const vegetable: Vegetable = 'carrot';

runtime;
