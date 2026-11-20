import type { LintStagedConfig } from '../lint-staged/types.ts';

type Command = string | string[];

type Task = {
  command: Command;
};

export type VitePlusConfig = {
  run?: {
    tasks?: Record<string, Task | Command>;
  };
  staged?: LintStagedConfig;
};
