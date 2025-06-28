type Step = {
  run?: string;
  uses?: string;
  with?: {
    repository: string;
    path: string;
  };
  'working-directory'?: string;
};

type Steps = Step[];

export type Job = {
  steps: Steps;
};

export type Runs = {
  using: string;
  main?: string;
  pre?: string;
  post?: string;
};
