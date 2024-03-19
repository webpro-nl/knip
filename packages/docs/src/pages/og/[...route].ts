import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
// eslint-disable-next-line import/order, n/no-restricted-import
import { resolve } from 'node:path';

// We can't import sharp normally because it's a CJS thing and those don't seems to work well with Astro, Vite, everyone
const require = createRequire(import.meta.url);
// ts-expect-error TS80005
const sharp = require('sharp');

const template = readFileSync(resolve('src/assets/og-template.svg'), 'utf-8');

export function breakText(str: string, maxLines: number, maxLineLen: number) {
  const segmenterTitle = new Intl.Segmenter('en-US', { granularity: 'word' });
  const segments = segmenterTitle.segment(str);

  let linesOut = [''];
  let lineNo = 0;
  let offsetInLine = 0;
  for (const word of Array.from(segments)) {
    if (offsetInLine + word.segment.length >= maxLineLen) {
      lineNo++;
      offsetInLine = 0;
      linesOut.push('');
    }

    if (lineNo >= maxLines) {
      return linesOut.slice(0, maxLines);
    }

    linesOut[lineNo] += word.segment.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    offsetInLine += word.segment.length;
  }

  return linesOut;
}

const getPages = async () => {
  const data = import.meta.glob(['/src/content/**/*.{md,mdx}'], { eager: true });
  const pages: Record<string, unknown> = {};
  for (const [filePath, page] of Object.entries(data)) {
    const imagePath = filePath.replace(/^\/src\/content\//, '').replace(/(\/index)?\.(md|mdx)$/, '.webp');
    pages[imagePath] = page;
  }
  return pages;
};

const S = ({ title }: { title: string; description: string[] }) => {
  const titleText = breakText(title, 2, 45)
    .map((text, i, texts) => {
      const m = (texts.length === 1 ? 0 : -75) / 2;
      const y = (1000 + m + 150 * i) / 2;
      const s = (texts.length === 1 ? 150 : 96) / 2;
      return `<text font-size="${s}" xml:space="preserve" fill="#fff"><tspan x="75" y="${y}">${text}</tspan></text>`;
    })
    .join('\n');

  return template.replace('<!-- titleText -->', titleText);
};

export const GET = async function ({ params }: { params: { route: string } }) {
  const pages = await getPages();
  const pageEntry = pages[params.route];
  if (!pageEntry) return new Response('Page not found', { status: 404 });

  const svgBuffer = Buffer.from(
    S({
      // @ts-expect-error TODO type properly
      title: pageEntry.frontmatter.hero?.tagline ?? pageEntry.frontmatter.title,
      // @ts-expect-error TODO type properly
      description: pageEntry.frontmatter.description,
    })
  );
  const body = await sharp(svgBuffer).resize(1200, 630).png().toBuffer();
  return new Response(body, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
};

export const getStaticPaths = async function () {
  const pages = await getPages();
  return Object.keys(pages).map(route => ({ params: { route } }));
};
