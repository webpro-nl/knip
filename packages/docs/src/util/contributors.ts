import { readFile } from 'node:fs/promises';

const ENVIRONMENT = import.meta.env.ENVIRONMENT;
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

const isFetch = ENVIRONMENT !== 'development' && Boolean(GITHUB_TOKEN);

export interface Contributor {
  html_url: string;
  avatar_url: string;
  login: string;
}

const url = new URL('/repos/webpro-nl/knip/contributors', 'https://api.github.com');
url.searchParams.set('per_page', '100');

const getAllContributors = async (url: URL) => {
  const allContributors: Contributor[] = [];
  let nextUrl: string = url.href;

  console.log('\n');
  while (nextUrl) {
    console.log(`Fetching contributors from ${nextUrl}`);
    const response = await fetch(nextUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      console.error('GitHub API request failed:');
      console.log(await response.text());
      return [];
    }

    const contributors = await response.json();
    allContributors.push(...contributors);

    const linkHeader = response.headers.get('Link');
    nextUrl = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || '';
  }

  return allContributors;
};

const load = async (): Promise<Contributor[]> => {
  const contributors = isFetch
    ? await getAllContributors(url)
    : JSON.parse(await readFile('mock/contributors.json', 'utf-8'));
  if (!Array.isArray(contributors)) {
    console.log(contributors);
    return [];
  }
  return contributors;
};

let contributors: Promise<Contributor[]> | undefined;

export const getContributors = () => (contributors ??= load());
