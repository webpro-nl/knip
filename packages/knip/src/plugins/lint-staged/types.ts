// https://github.com/lint-staged/lint-staged/blob/main/lib/index.d.ts

type SyncGenerateTask = (stagedFileNames: readonly string[]) => string | string[];

type AsyncGenerateTask = (stagedFileNames: readonly string[]) => Promise<string | string[]>;

type GenerateTask = SyncGenerateTask | AsyncGenerateTask;

type TaskFunction = {
  title: string;
  task: (stagedFileNames: readonly string[]) => void | Promise<void>;
};

export type Entry = string | TaskFunction | GenerateTask | (string | GenerateTask)[];

export type LintStagedConfig = Record<string, Entry> | GenerateTask;
