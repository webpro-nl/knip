import { AcceptEncoding } from '@remix-run/headers/accept-encoding';

export const preferred = AcceptEncoding.from('gzip, br').getPreferred(['br', 'gzip']);
