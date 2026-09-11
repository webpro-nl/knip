import { defineRailway, github, project, service } from 'railway/iac';

export default defineRailway(() => {
  const storefront = service('storefront', {
    source: github('fruit-stand/storefront', { rootDirectory: 'services/storefront' }),
    build: 'node scripts/build.ts',
    start: 'node src/serve.ts',
    preDeploy: 'npx drizzle-kit migrate',
  });
  const inventory = service('inventory', {
    root: 'services/inventory',
    deploy: { preDeployCommand: ['node scripts/deploy.ts'] },
  });

  return project('fruit-stand', { resources: [storefront, inventory] });
});
