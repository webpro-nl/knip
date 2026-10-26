import { LibSQLStore } from '@mastra/libsql';

export default new LibSQLStore({ id: 'storage', url: 'file:./mastra.db' });
