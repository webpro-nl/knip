import { api, type APIError } from 'encore.dev/api';
import { formatName } from '../lib/format.ts';

export const getUser = api({ method: 'GET', path: '/users/:id' }, async ({ id }: { id: string }) => ({
  name: formatName(id),
}));

export type GetUserError = APIError;
