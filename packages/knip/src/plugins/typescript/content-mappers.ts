import type { Input } from '../../util/input.ts';
import { contentMappers as mdxContentMappers, resolveContentMapperOptions as resolveMdxOptions } from '../mdx/index.ts';

type ResolveContentMapperOptions = (options: Record<string, unknown>) => Input[];

export const contentMapperResolvers = new Map<string, ResolveContentMapperOptions>();

for (const name of mdxContentMappers) contentMapperResolvers.set(name, resolveMdxOptions);
