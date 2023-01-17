export type VitestConfig = {
  test: {
    environment?: string;
    reporters?: string[];
    coverage?: {
      provider: string;
    };
  };
};
