import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_OWNER = 'webpro-nl';
const REPO_NAME = 'knip';
const PACKAGE_NAME = '@knip/mcp';

const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
let spinnerTick = 0;

function renderStatus(message) {
  const frame = SPINNER_FRAMES[spinnerTick % SPINNER_FRAMES.length];
  spinnerTick++;
  process.stdout.write(`\r\x1b[K${frame} ${message}`);
}

async function fetchAllReleases() {
  let page = 1;
  let allReleases = [];
  let hasMore = true;

  while (hasMore) {
    renderStatus(`Fetching GitHub releases (page ${page}, 100/page)...`);
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=100&page=${page}`;

    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'node-changelog-generator',
    };

    if (TOKEN) {
      headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API Error (${response.status}) on page ${page}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      hasMore = false;
    } else {
      allReleases = allReleases.concat(data);
      page++;
    }
  }

  return allReleases;
}

function matchesPackage(tagName, targetPackage) {
  const lastAtIndex = tagName.lastIndexOf('@');

  if (lastAtIndex !== -1) {
    return tagName.slice(0, lastAtIndex) === targetPackage;
  }

  return targetPackage === 'knip' && /^v?\d/.test(tagName);
}

function generateMarkdown(releases) {
  const matchedReleases = releases.filter(r => matchesPackage(r.tag_name || '', PACKAGE_NAME));

  let content = `# Changelog\n\n`;
  const total = matchedReleases.length;

  for (let i = 0; i < total; i++) {
    const release = matchedReleases[i];
    const heading = release.name || release.tag_name;
    const cleanHeading = heading.startsWith('Release ') ? heading : `Release ${heading}`;

    renderStatus(`[${i + 1}/${total}] Formatting: ${cleanHeading}`);

    content += `## ${cleanHeading}\n\n`;
    content += `${release.body ? release.body.trim() : 'No release notes were provided.'}\n\n`;
  }

  return { content, count: total };
}

async function run() {
  try {
    const rawReleases = await fetchAllReleases();
    const { content, count } = generateMarkdown(rawReleases);

    const targetPath = path.join(__dirname, 'CHANGELOG.md');
    fs.writeFileSync(targetPath, content, 'utf8');

    process.stdout.write(
      `\r\x1b[K✔ CHANGELOG.md generated successfully with ${count} releases (filtered from ${rawReleases.length} total repo releases).\n`
    );
  } catch (err) {
    process.stdout.write('\n');
    console.error(err);
    process.exit(1);
  }
}

run();
