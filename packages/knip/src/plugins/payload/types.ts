export type PayloadConfig = Promise<{
  admin?: {
    importMap?: {
      // Note that the `admin.importMap.baseDir` config only affects how component paths are written,
      // and is unrelated to the location of importMap.
      importMapFile?: string;
    };
  };
  routes?: {
    admin?: string;
  };
}>;
