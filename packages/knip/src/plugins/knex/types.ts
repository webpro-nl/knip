export interface KnexConfig {
  client?: string;
  connection?: unknown;
  migrations?: {
    directory?: string | string[];
    tableName?: string;
  };
  seeds?: {
    directory?: string | string[];
  };
}
