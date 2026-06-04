export const QUERY_KEY = 'live';

const query: Record<string, string> = {};
const value = query[QUERY_KEY];
query[QUERY_KEY] = 'updated';
delete query[QUERY_KEY];
value;
