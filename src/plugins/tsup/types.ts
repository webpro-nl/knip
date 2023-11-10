type Entry = string[] | Record<string, string>;

type Options = {
  entry?: Entry;
};

type MaybePromise<T> = T | Promise<T>;

export type TsupConfig = Options | Options[] | ((overrideOptions: Options) => MaybePromise<Options | Options[]>);
