import { PassThrough } from 'node:stream';
import {
  createOptions as options,
  createSession as session,
  KNIP_CONFIG_LOCATIONS,
} from 'knip/session';
import { CodeActionKind, createConnection as connect } from 'vscode-languageserver/node';

export { CodeActionKind, KNIP_CONFIG_LOCATIONS };
export const knip = { createOptions: options, createSession: session };
export const createOptions = options => knip.createOptions(options);
export const createSession = (...args) => knip.createSession(...args);
export const connection = connect(new PassThrough(), new PassThrough());
export const createConnection = () => connection;
