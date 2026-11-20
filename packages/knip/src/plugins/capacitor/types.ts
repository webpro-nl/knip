export type CapacitorPlatform = 'android' | 'ios';

export type CapacitorConfig = {
  includePlugins?: string[];
  android?: { includePlugins?: string[] };
  ios?: { includePlugins?: string[] };
};

export type CapacitorPluginPackage = {
  capacitor?: Partial<Record<CapacitorPlatform, unknown>>;
};
