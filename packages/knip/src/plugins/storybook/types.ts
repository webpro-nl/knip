type BuilderOptions = { viteConfigPath?: string | null };

type Stories = (string | { directory: string; files?: string; titlePrefix?: string })[];

export type StorybookConfig = {
  stories?: Stories | ((patterns: string[]) => Promise<string[]>);
  addons?: (string | { name: string })[];
  core?: {
    builder?: string | { name?: string; options?: BuilderOptions };
  };
  framework?:
    | string
    | {
        name?: string;
        options?: {
          builder?: BuilderOptions;
        };
      };
};
