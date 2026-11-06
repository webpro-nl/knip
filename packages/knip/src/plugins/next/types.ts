// https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

type NextConfig = {
  pageExtensions?: string[];
  images?: { loaderFile?: string };
  cacheHandler?: string;
  cacheHandlers?: Record<string, string | undefined>;
  turbopack?: {
    rules?: Record<string, unknown>;
    resolveAlias?: Record<string, unknown>;
  };
};

export type NextConfigModule =
  | NextConfig
  | ((phase: string, context: { defaultConfig: NextConfig }) => NextConfig | Promise<NextConfig>);
