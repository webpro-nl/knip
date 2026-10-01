import { entry } from '@fixtures/e2e-lib-call-arg';

const configs = entry.listConfigs();
configs.map(c => c.url);
