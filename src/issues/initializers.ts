import { Issues, Counters, Report } from '../types/issues.js';

export const initIssues = (): Issues => ({
  files: new Set(),
  dependencies: {},
  devDependencies: {},
  unlisted: {},
  exports: {},
  types: {},
  nsExports: {},
  nsTypes: {},
  duplicates: {},
  enumMembers: {},
  classMembers: {},
});

export const initCounters = (): Counters => ({
  files: 0,
  dependencies: 0,
  devDependencies: 0,
  unlisted: 0,
  exports: 0,
  types: 0,
  nsExports: 0,
  nsTypes: 0,
  duplicates: 0,
  enumMembers: 0,
  classMembers: 0,
  processed: 0,
  total: 0,
});

export const initReport = (): Report => ({
  files: true,
  dependencies: true,
  devDependencies: true,
  unlisted: true,
  exports: true,
  types: true,
  nsExports: true,
  nsTypes: true,
  duplicates: true,
  enumMembers: true,
  classMembers: true,
});
