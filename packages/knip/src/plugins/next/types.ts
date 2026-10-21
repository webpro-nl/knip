// https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

type NextConfig = {
  pageExtensions?: string[];
  turbopack?: {
    rules?: Record<string, unknown>;
    resolveAlias?: Record<string, unknown>;
  };
};

export type NextConfigModule =
  | NextConfig
  | ((phase: string, context: { defaultConfig: NextConfig }) => NextConfig | Promise<NextConfig>);
