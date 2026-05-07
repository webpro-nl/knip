import { entry } from '@fixtures/e2e-lib-call-forward-decl';

const files = await entry.getDownloadFiles();
files.map(f => f.name);
