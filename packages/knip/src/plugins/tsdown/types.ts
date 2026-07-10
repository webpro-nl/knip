// https://github.com/rolldown/tsdown/blob/main/src/config/types.ts#L71
export type Entry = (string | Record<string, string[] | string>)[] | string | Record<string, string[] | string>;

export type Options = {
  entry?: Entry;
  deps?: { neverBundle?: unknown };
};

type MaybePromise<T> = T | Promise<T>;

export type TsdownConfig = Options | Options[] | ((overrideOptions: Options) => MaybePromise<Options | Options[]>);
