export type WranglerConfig = {
  main?: string;
  build?: {
    command?: string;
    cwd?: string;
  };
};
