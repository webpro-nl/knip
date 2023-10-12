export type StorybookConfig = {
  stories?: string[] | ((patterns: string[]) => Promise<string[]>);
  addons?: (string | { name: string })[];
  core?: {
    builder?: string;
  };
  framework?: {
    name?: string;
  };
};
