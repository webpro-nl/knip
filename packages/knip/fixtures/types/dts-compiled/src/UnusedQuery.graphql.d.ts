import * as Types from './types';

export type UnusedQueryQueryVariables = Types.Exact<{ [key: string]: never }>;

export type UnusedQueryQuery = {
  __typename?: 'Query';
  example?: { __typename?: 'Example'; name?: string | null } | null;
};
