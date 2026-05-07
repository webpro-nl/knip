import { entry } from '@fixtures/e2e-lib-member-call';

const files = await entry.listFiles();
files.map(f => f.name);
