type MiseEnvironment = {
  PATH?: unknown;
  _?: { path?: string | string[] };
};

type TaskReference = { task: string } | { tasks: string[] };
type Run = string | (string | TaskReference)[];

type MiseTask = {
  run?: Run;
  run_windows?: Run;
  dir?: string;
  env?: MiseEnvironment;
};

export type MiseConfig = {
  tasks?: Record<string, string | string[] | MiseTask>;
  env?: MiseEnvironment | MiseEnvironment[];
  task_config?: { dir?: string };
};
