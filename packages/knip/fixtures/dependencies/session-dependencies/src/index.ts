import { debounce } from 'lodash';
import { z } from 'zod';
import type { infer as Infer } from 'zod';
import { helper } from './utils.js';

const schema = z.object({ name: z.string() });
type Schema = Infer<typeof schema>;

const debouncedFn = debounce(() => 'debounced');

export { debouncedFn, schema, helper };
export type { Schema };
