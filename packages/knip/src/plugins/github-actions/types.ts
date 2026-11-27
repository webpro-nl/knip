export type Step = {
  run?: string;
  uses?: string;
  with?: {
    repository: string;
    path: string;
  };
  'working-directory'?: string;
  parallel?: Step[];
};

type Steps = Step[];

export type Job = {
  steps: Steps;
  defaults?: { run?: { 'working-directory'?: string } };
};

export type Runs = {
  using: string;
  main?: string;
  pre?: string;
  post?: string;
};
