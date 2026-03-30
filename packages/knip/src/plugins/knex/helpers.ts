const CLIENT_MAPPING: Record<string, string[]> = {
  pg: ['pg'],
  postgres: ['pg'],
  postgresql: ['pg'],
  mysql: ['mysql', 'mysql2'],
  mysql2: ['mysql2'],
  sqlite3: ['sqlite3'],
  'better-sqlite3': ['better-sqlite3'],
  mssql: ['tedious'],
  tedious: ['tedious'],
  oracledb: ['oracledb'],
  oracle: ['oracledb'],
  cockroachdb: ['pg'],
  redshift: ['pg'],
};

export const clientToPackages = (client: string): string[] => {
  const normalizedClient = client.toLowerCase();
  return CLIENT_MAPPING[normalizedClient] ?? [];
};
