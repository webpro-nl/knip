type Script = string | string[];

type Entry = Script | ((api: { filenames: string[] }) => Script | Promise<Script>);

type Config = Record<string, Entry>;

export type NanoStagedConfig = Config | (() => Config);
