import { readFile } from 'node:fs/promises';
import { graphql } from '@octokit/graphql';

const ENVIRONMENT = import.meta.env.ENVIRONMENT;
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

const isFetch = ENVIRONMENT !== 'development' && Boolean(GITHUB_TOKEN);
const agentLogins = new Set(['claude', 'codex', 'copilot', 'cursoragent', 'gemini-cli', 'openhands-agent']);

export interface Contributor {
  html_url: string;
  avatar_url: string;
  login: string;
}

interface GraphQLResponse {
  repository: {
    object: {
      oid: string;
      history: {
        nodes: {
          authors: {
            nodes: { user: Contributor | null }[];
            pageInfo: { hasNextPage: boolean };
          };
        }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
  };
}

const getAllContributors = async () => {
  const allContributors = new Map<string, Contributor & { contributions: number }>();
  let revision = 'HEAD';
  let cursor: string | null = null;

  try {
    do {
      console.log('Fetching contributors from commit history');
      const response: GraphQLResponse = await graphql<GraphQLResponse>({
        query: `
          query($revision: String!, $after: String) {
            repository(owner: "webpro-nl", name: "knip") {
              object(expression: $revision) {
                ... on Commit {
                  oid
                  history(first: 100, after: $after) {
                    nodes {
                      authors(first: 100) {
                        nodes {
                          user {
                            login
                            html_url: url
                            avatar_url: avatarUrl
                          }
                        }
                        pageInfo { hasNextPage }
                      }
                    }
                    pageInfo { hasNextPage endCursor }
                  }
                }
              }
            }
          }
        `,
        revision,
        after: cursor,
        headers: { authorization: `Bearer ${GITHUB_TOKEN}` },
      });
      const { oid, history } = response.repository.object;
      revision = oid;

      for (const { authors } of history.nodes) {
        if (authors.pageInfo.hasNextPage) throw new Error('Contributor query exceeded 100 authors in a commit');
        const seen = new Set<string>();
        for (const { user } of authors.nodes) {
          if (!user || seen.has(user.login)) continue;
          seen.add(user.login);
          const contributor = allContributors.get(user.login);
          if (contributor) contributor.contributions++;
          else allContributors.set(user.login, { ...user, contributions: 1 });
        }
      }

      cursor = history.pageInfo.hasNextPage ? history.pageInfo.endCursor : null;
    } while (cursor);
  } catch (error) {
    console.error('GitHub API request failed:', error instanceof Error ? error.message : error);
    return [];
  }

  return [...allContributors.values()].sort((a, b) => b.contributions - a.contributions);
};

const load = async (): Promise<Contributor[]> => {
  const contributors: Contributor[] = isFetch
    ? await getAllContributors()
    : JSON.parse(await readFile('mock/contributors.json', 'utf-8'));
  if (!Array.isArray(contributors)) {
    console.log(contributors);
    return [];
  }
  return contributors.filter(({ login }) => !login.endsWith('[bot]') && !agentLogins.has(login.toLowerCase()));
};

let contributors: Promise<Contributor[]> | undefined;

export const getContributors = () => (contributors ??= load());
