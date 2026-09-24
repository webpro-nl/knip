import { defineRailway, github, image, project, service } from 'railway/iac';

const storefrontSource = github('fruit-stand/storefront', { rootDirectory: 'services/storefront' });

export default defineRailway(() => {
  const storefront = service('storefront', {
    source: storefrontSource,
    build: 'node scripts/build.ts',
    start: 'node src/serve.ts',
    preDeploy: 'npx storefront-tool prepare',
  });
  const inventory = service('inventory', {
    root: 'services/inventory',
    start: './scripts/deploy.ts',
  });
  const analytics = service('analytics', {
    source: github('other-stand/analytics'),
    start: 'node scripts/build.ts',
  });
  const dashboard = service('dashboard', {
    source: image('nginx:latest'),
    start: 'node dashboard/start.ts',
    preDeploy: 'npx external-tool prepare',
  });

  return project('fruit-stand', { resources: [storefront, inventory, analytics, dashboard] });
});
