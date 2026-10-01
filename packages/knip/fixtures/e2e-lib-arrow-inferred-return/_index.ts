import { entry } from '@fixtures/e2e-lib-arrow-inferred-return';

const handler = entry.createHandler();
const status = handler.run({ force: true });
const files = await entry.getDownloadFiles();

status;
files.map(file => file.name);
