// eslint-disable-next-line import/order
import { createRequire } from 'node:module';

// We can't import sharp normally because it's a CJS thing and those don't seems to work well with Astro, Vite, everyone
const require = createRequire(import.meta.url);
// ts-expect-error TS80005
const sharp = require('sharp');

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
  const data = await import.meta.glob(['/src/content/**/*.{md,mdx}'], { eager: true });
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
      const m = texts.length === 1 ? 0 : -75;
      const y = 1000 + m + 150 * i;
      const s = texts.length === 1 ? 150 : 96;
      return `<text font-size="${s}" xml:space="preserve" fill="#fff"><tspan x="150" y="${y}">${text}</tspan></text>`;
    })
    .join('\n');

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1260">
  <defs>
  <style>
    text {
      font-family: 'Source Sans Pro';
    }


    @font-face {
      font-family: 'Source Sans Pro';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/fonts/SourceSansPro-Regular.otf') format('truetype');
    }

  </style>
</defs>
  <defs>
    <style>
      .cls-1 {
        stroke-width: 20px;
      }

      .cls-1, .cls-2, .cls-3 {
        stroke: #fff;
        stroke-miterlimit: 10;
      }

      .cls-1, .cls-3 {
        fill: none;
        opacity: .7;
      }

      .cls-2 {
        stroke-width: 7px;
      }

      .cls-2, .cls-4 {
        fill: #f68923;
      }

      .cls-3 {
        stroke-width: 30px;
      }

      .cls-5 {
        fill: #2a2a2a;
      }

      .cls-5, .cls-6, .cls-4 {
        stroke-width: 0px;
      }

      .cls-6 {
        fill: #ededed;
      }
    </style>
  </defs>
  <g id="Layer_1-2" data-name="Layer 1">
    <rect class="cls-5" width="2400" height="1260"/>
    <rect class="cls-2" x="113.79" y="105.58" width="424.14" height="424.14" rx="80.78" ry="80.78"/>
    <path class="cls-1" d="m345.25,474.82c67.48-.78,64.82-94.87-.97-94.16"/>
    <line class="cls-3" x1="326.87" y1="149.84" x2="330.34" y2="484.94"/>
    <line class="cls-3" x1="457.23" y1="200.16" x2="217.81" y2="434.65"/>
    <path class="cls-1" d="m281.77,350.99c-47.28-48.16-113.33,18.91-67.28,65.89"/>
    <g>
      <path class="cls-6" d="m1641.11,118.38h18.31l.92,84.73h.73l43.31-44.22h20.58l-65.55,65.89v23.92h-18.31V118.38Zm35.3,84.47l10.84-11.71,43.86,57.55h-21.97l-32.72-45.84Z"/>
      <path class="cls-6" d="m1739.48,158.89h14.97l1.46,14.32h.74c9-9.23,19.22-16.52,33.08-16.52,21,0,30.57,12.91,30.57,36.3v55.71h-18.31v-53.31c0-15.67-5.26-22.92-18.58-22.92-9.77,0-16.35,4.82-25.61,14.31v61.93h-18.31v-89.8Z"/>
      <polygon class="cls-6" points="1871.42 173.5 1831.27 173.5 1831.27 158.89 1889.73 158.89 1889.73 248.69 1871.42 248.69 1871.42 173.5"/>
      <path class="cls-4" d="m1865.77,128.31c0-7.91,5.63-13.36,13.33-13.36s13.33,5.45,13.33,13.36-5.63,13.29-13.33,13.29-13.33-5.22-13.33-13.29Z"/>
      <path class="cls-6" d="m1915,158.89h14.97l1.46,10.85h.59c8.03-7.59,19.35-13.05,29.92-13.05,23.73,0,36.84,17.93,36.84,45.79,0,30.57-19.11,48.43-40.34,48.43-8.2,0-17.88-4.06-25.55-11.13h-.44l.87,16.36v29.25h-18.31v-126.48Zm65.02,43.65c0-18.81-6.84-30.59-23.02-30.59-7.35,0-15.55,3.63-23.7,12v42.49c7.45,6.75,15.89,9.19,21.62,9.19,14.3,0,25.1-11.86,25.1-33.09Z"/>
      <path class="cls-4" d="m2014.23,237.57c0-7.69,5.76-13.33,13.33-13.33s13.33,5.63,13.33,13.33-5.76,13.32-13.33,13.32-13.33-5.49-13.33-13.32Z"/>
      <path class="cls-6" d="m2056.34,203.94c0-29.24,19.26-47.26,40.06-47.26,10.49,0,18.38,4.06,25.84,10.98h.44l-.87-15.77v-33.51h18.31v130.31h-14.97l-1.46-11.15h-.59c-7.18,7.3-17.53,13.35-28.19,13.35-23.19,0-38.56-17.18-38.56-46.96Zm65.46,19.69v-42.49c-7.26-6.75-14.15-9.19-21.25-9.19-14,0-25.47,12.16-25.47,31.77s9.07,31.91,24.05,31.91c8.14,0,15.58-3.86,22.66-12Z"/>
      <path class="cls-6" d="m2149.71,203.64c0-29.24,22.03-46.96,46.06-46.96,26.35,0,41.35,17.31,41.35,42.38,0,3.87-.47,7.59-.84,9.94h-73.89v-13.41h62.48l-3.96,4.47c0-19.45-9.41-29.21-24.64-29.21s-28.61,11.61-28.61,32.78,13.84,32.93,33.14,32.93c10.04,0,18.15-3.03,26.24-7.91l6.41,11.57c-9.23,6.09-21.18,10.66-34.96,10.66-27.25,0-48.77-17.35-48.77-47.26Z"/>
      <path class="cls-6" d="m2238.02,158.89h18.61l18.97,48.59c3.36,9.04,6.46,18,9.48,26.88h.74c3.02-8.88,5.82-17.84,9.33-26.88l18.97-48.59h17.59l-36.16,89.8h-20.7l-36.82-89.8Z"/>
    </g>
    ${titleText}
  </g>
</svg>
`;
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
  return new Response(body);
};

export const getStaticPaths = async function () {
  const pages = await getPages();
  return Object.keys(pages).map(route => ({ params: { route } }));
};
