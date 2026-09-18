import { parseFrontmatter } from './parse-frontmatter.js';

export const transform = content => parseFrontmatter(content);
