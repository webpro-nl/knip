export type VitestConfig = {
  test: {
    coverage?: {
      provider: string;
    };
    environment?: string;
    globalSetup?: string | string[];
    reporters?: (string | unknown)[];
    setupFiles?: string | string[];
  };
};
