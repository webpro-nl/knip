import { service } from 'railway/iac';

export const worker = service('worker', {
  root: 'infra',
  start: 'node jobs/process.ts',
  preDeploy: 'npx drizzle-kit migrate',
});
