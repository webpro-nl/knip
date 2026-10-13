export type Routes = [
  typeof import('./routes/(base)/(home)/index.tsx'),
  typeof import('./routes/(base)/[...404]/index.tsx'),
  typeof import('./routes/(seo)/robots.txt/index.ts'),
];
