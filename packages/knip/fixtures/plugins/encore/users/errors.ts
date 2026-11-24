import { APIError } from 'encore.dev/api';

export const notFound = () => APIError.notFound('user not found');
