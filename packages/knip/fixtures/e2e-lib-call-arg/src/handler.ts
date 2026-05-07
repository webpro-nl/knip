export interface UnusedHelperOptions {
  stale: boolean;
}

export interface SiteConfig {
  url: string;
}

const wrap = <T>(fn: T): T => fn;
const inner = (): SiteConfig[] => [];

export const listConfigs = wrap(inner);
