export interface VitestConfig {
  test: {
    include: string[];
    coverage?: {
      provider: string;
    };
    environment?: string;
    globalSetup?: string | string[];
    reporters?: (string | unknown)[];
    setupFiles?: string | string[];
  };
}

export type VitestWorkspaceConfig = (string | VitestConfig)[];
