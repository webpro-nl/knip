type EntryInput = string | string[] | Record<string, string>;

interface ViteBuildConfig {
  build?: {
    rollupOptions?: { input?: EntryInput };
    lib?: { entry?: EntryInput };
  };
}

type ConfigEnv = { command: string; mode: string };

type Section = ViteBuildConfig | ((env: ConfigEnv) => ViteBuildConfig | Promise<ViteBuildConfig>);

type ElectronViteConfigObject = {
  main?: Section;
  preload?: Section;
  renderer?: Section;
};

export type ElectronViteConfig =
  | ElectronViteConfigObject
  | ((env: ConfigEnv) => ElectronViteConfigObject | Promise<ElectronViteConfigObject>);
