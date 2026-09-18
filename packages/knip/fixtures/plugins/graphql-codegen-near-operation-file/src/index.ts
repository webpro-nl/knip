import { query as nestedQuery } from '../features/nested/deep/Query.ts';
import { query as opQuery } from '../normalized/deep/Op.ts';
import { query as getUserQuery } from '../operations/GetUser.ts';
import { used } from './used.ts';

used();
nestedQuery.concat(getUserQuery, opQuery);
