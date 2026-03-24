export const unusedFn = () => {};

/** @internal */
export const internalTestedFn = () => {};

/** @internal */
export const internalUnusedFn = () => {};

/** @alpha */
export const alphaFn = () => {};

/** @beta */
export const betaFn = () => {};

/** @public */
export const publicFn = () => {};

/** @unknown @ invalid */
export const invalidTaggedFn = () => {};

/** @public */
export function overloadFn(x: number): string;
export function overloadFn(x: boolean): number;
export function overloadFn(x: number | boolean): string | number {
  return '0';
}

export function overloadTagOnSecond(x: number): string;
/** @public */
export function overloadTagOnSecond(x: boolean): number;
export function overloadTagOnSecond(x: number | boolean): string | number {
  return '0';
}

export function overloadTagOnImpl(x: number): string;
export function overloadTagOnImpl(x: boolean): number;
/** @public */
export function overloadTagOnImpl(x: number | boolean): string | number {
  return '0';
}

export function overloadUntagged(x: number): string;
export function overloadUntagged(x: boolean): number;
export function overloadUntagged(x: number | boolean): string | number {
  return '0';
}

/** @ignoreunresolved */
import unresolvedAndIgnored from './unresolved';

/** @ignoreunresolved */
export * from './something.generated';

/** @ignoreunresolved */
const NS = require('./commmonjs');

export interface UsedViaJSDoc {
  name: string;
}

export interface UnusedInterface {
  value: number;
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InternalWithLineComment {}
