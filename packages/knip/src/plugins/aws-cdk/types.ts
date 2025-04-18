export type AwsCdkConfig = {
  app: string;
  watch?: {
    include: string[];
  };
  context?: Record<string, unknown>;
};
