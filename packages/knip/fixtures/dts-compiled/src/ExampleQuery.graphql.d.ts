import * as Types from './types';

export type ExampleQueryQueryVariables = Types.Exact<{ [key: string]: never }>;

export type ExampleQueryQuery = {
  __typename?: 'Query';
  example?: { __typename?: 'Example'; name?: string | null; description?: string | null } | null;
};
