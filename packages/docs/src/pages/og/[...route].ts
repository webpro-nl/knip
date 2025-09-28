import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
// ts-expect-error TS80005
const sharp = require('sharp');

const template = readFileSync(resolve('src/assets/og-template.svg'), 'utf-8');

const getPages = async () => {
  const data = import.meta.glob(['/src/content/**/*.{md,mdx}'], { eager: true });
  const pages: Record<string, unknown> = {};
  for (const [filePath, page] of Object.entries(data)) {
    const imagePath = filePath.replace(/^\/src\/content\//, '').replace(/(\/index)?\.(md|mdx)$/, '.webp');
    pages[imagePath] = page;
  }
  return pages;
};

const renderSVG = ({ title }: { title: string }) => {
  const lines = balanceText(title, 30);

  const titleText = `
    <text
      text-anchor="start"
      text-rendering="optimizeLegibility"
      font-size="${lines.length === 1 ? 80 : 64}"
      fill="#fff"
      x="75"
      y="500"
    >
      ${lines.map((line, i) => `<tspan x="75" dy="${i === 0 ? '0' : '1.2em'}" >${encodeXML(line)}</tspan>`).join('')}
    </text>
  `;

  return template.replace('<!-- titleText -->', titleText);
};

function encodeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function balanceText(text: string, maxLen: number): string[] {
  const words = text.split(' ');
  if (words.join(' ').length <= maxLen) return [text];

  let bestSplit = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < words.length - 1; i++) {
    const line1 = words.slice(0, i + 1).join(' ');
    const line2 = words.slice(i + 1).join(' ');
    const diff = Math.abs(line1.length - line2.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i + 1;
    }
  }

  return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
}

export const GET = async ({ params }: { params: { route: string } }) => {
  const pages = await getPages();
  const pageEntry = pages[params.route];
  if (!pageEntry) return new Response('Page not found', { status: 404 });

  // @ts-expect-error TODO type properly
  const title = pageEntry.frontmatter.hero?.tagline ?? pageEntry.frontmatter.title;
  const svgBuffer = Buffer.from(renderSVG({ title }));
  const body = await sharp(svgBuffer).resize(1200, 630).webp({ lossless: true }).toBuffer();

  return new Response(body, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
};

export const getStaticPaths = async () => {
  const pages = await getPages();
  return Object.keys(pages).map(route => ({ params: { route } }));
};
