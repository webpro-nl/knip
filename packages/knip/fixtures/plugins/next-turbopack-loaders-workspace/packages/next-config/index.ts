import { getBaseNextConfig } from './base.ts';

throw new Error('Shared config must not execute during analysis');

export function getSharedNextConfig() {
  return getBaseNextConfig();
}

export function getRuleOptions() {
  return { as: '*.css' };
}
