import { resolvers } from './resolvers.js';
import { useAliasedResolvers } from './aliased-import.js';
import { useUtils } from './consumer.js';
import { useFruit } from './member-access.js';
import { useAnimal } from './destructured.js';
import { allColors, justRed } from './mixed-usage.js';
import * as Queues from './queues.js';

export function useResolvers() {
  return [resolvers, useAliasedResolvers, useUtils, useFruit, useAnimal, allColors, justRed];
}

export const registry = { 'my-queue': { handlers: { ...Queues } } };
