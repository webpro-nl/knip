// https://github.com/orval-labs/orval/blob/master/packages/core/src/types.ts\

export type OverrideInput = {
  transformer?: InputTransformer;
};

export type MutatorObject = {
  path: string;
  name?: string;
};

type InputTransformer = string | ((...args: unknown[]) => unknown);
