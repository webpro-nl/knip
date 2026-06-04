import {
  connect,
  fetchData,
  initialize,
  setLogLevel,
  createConnection,
  setHandler,
  type QueryResult,
  type UserEntity,
  type Document,
  applyFilters,
  type DirectlyUsed,
  configure,
} from './lib.ts';

connect({ host: '', port: 0 });
fetchData();
initialize();
setLogLevel(0);
createConnection();
setHandler(() => {});

const r: QueryResult = { ok: true, data: '' };
void r;

const u: UserEntity = { id: '', createdAt: 0, name: '' };
void u;

const d: Document = { meta: { version: 1 }, content: '' };
void d;

applyFilters([]);

const x: DirectlyUsed = { value: 1 };
void x;

configure({ timeout: 100 });
