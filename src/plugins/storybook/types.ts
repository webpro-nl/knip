export type StorybookConfig = {
  addons?: (string | { name: string })[];
  core?: {
    builder?: string;
  };
  framework?: {
    name?: string;
  }
};
