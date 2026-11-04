import micromatch from 'micromatch';
import anything from 'next';
import type { Things } from '@types/without-the-package';
import type { Expression } from 'estree';
import type { Schema } from 'type-only-production-types';
import type { WebSocket } from 'ws';

export type * as sockets from 'ws';
export type * as files from 'fs';

export function readyState(socket: WebSocket): number {
  return socket.readyState;
}
