// https://taskfile.dev/docs/reference/schema#command
export type TaskfileCommand =
  | string
  | {
      cmd?: string;
      task?: string;
      defer?: string | { task?: string; [key: string]: unknown };
      for?: unknown;
      [key: string]: unknown;
    };

// https://taskfile.dev/docs/reference/schema#command
export type TaskfileTask =
  | string
  | string[]
  | {
      cmds?: string | TaskfileCommand[];
      cmd?: string;
      [key: string]: unknown;
    };

// https://taskfile.dev/docs/reference/schema#include
export type TaskfileInclude = string | { taskfile: string; [key: string]: unknown };

// https://taskfile.dev/docs/reference/schema
export type TaskfileConfig = {
  tasks?: Record<string, TaskfileTask>;
  includes?: Record<string, TaskfileInclude>;
  [key: string]: unknown;
};
