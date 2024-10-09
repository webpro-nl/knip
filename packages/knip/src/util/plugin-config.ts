const toConfigMap =
  (
    defaultExtensions: string[],
    builderConfig: {
      rcPrefix?: string;
      rcSuffix?: string;
      configDir?: boolean;
      configFiles?: boolean;
      configFilesAllExtensions?: boolean;
      additionalExtensions?: string[];
    }
  ) =>
  (moduleName: string, options?: typeof builderConfig) => {
    const config = {
      rcPrefix: '.',
      rcSuffix: 'rc',
      // Generate .config/<file>
      configDir: true,
      // Generate <file>.config.<ext>
      configFiles: true,
      // Allow for .json, .yaml, .yml, .toml etc
      configFilesAllExtensions: false,
      additionalExtensions: [],
      ...builderConfig,
      ...options,
    };
    const { rcPrefix, rcSuffix } = config;
    const jsTypeExtensions = ['js', 'ts', 'cjs', 'mjs', 'cts', 'mts'];
    const extensions = [...defaultExtensions, ...config.additionalExtensions];

    const baseFiles = [
      `${rcPrefix}${moduleName}${rcSuffix}`,
      ...(config.configDir ? [`.config/${moduleName}${rcSuffix}`] : []),
    ];

    const rcFiles = `${rcPrefix}${moduleName}${rcSuffix}.{${extensions.join(',')}}`;
    const configExtensions = extensions.filter(
      ext => config.configFilesAllExtensions || jsTypeExtensions.includes(ext)
    );
    const configFiles = config.configFiles ? [`${moduleName}.config.{${configExtensions.join(',')}}`] : [];
    const configDirFiles = config.configDir ? [`.config/${moduleName}${rcSuffix}.{${extensions.join(',')}}`] : [];

    return [...baseFiles, rcFiles, ...configFiles, ...configDirFiles];
  };

export const toCosmiconfig = toConfigMap(['json', 'yaml', 'yml', 'js', 'ts', 'cjs', 'mjs'], { configDir: true });
export const toLilconfig = toConfigMap(['json', 'js', 'cjs', 'mjs'], { configDir: true });
export const toUnconfig = toConfigMap(['json', 'ts', 'mts', 'cts', 'js', 'mjs', 'cjs'], {
  configDir: false,
  rcPrefix: '',
  rcSuffix: '',
  configFiles: false,
});
