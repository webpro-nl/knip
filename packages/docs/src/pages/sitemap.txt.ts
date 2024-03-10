import type { APIContext } from 'astro';

interface Page {
  frontmatter: {
    draft: boolean;
  };
}

const data: Record<string, Page> = import.meta.glob(['/src/content/**/!([)*.{md,mdx}'], { eager: true });
const plugins = import.meta.glob(['/dist/reference/plugins/*/index.html'], { eager: true });

const pages = new Set<string>();
for (const [filePath, page] of Object.entries(data)) {
  if (page?.frontmatter?.draft === true) continue;
  pages.add(filePath.replace(/^\/src\/content\/docs\//, '').replace(/(\/?index)?\.(md|mdx)$/, ''));
}

for (const [filePath] of Object.entries(plugins)) {
  pages.add(filePath.replace(/^\/dist\//, '').replace(/\/index.html$/, ''));
}

export async function GET(context: APIContext) {
  const baseUrl = context.site?.href;
  const documents = [...pages].map(entry => new URL(entry, baseUrl).href).sort();
  return new Response(documents.join('\n'));
}
