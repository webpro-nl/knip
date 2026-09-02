import { parseEnvSpecDotEnvFile, ParsedEnvSpecKeyValuePair, ParsedEnvSpecStaticValue } from '@env-spec/parser';
import { debugLog } from '../../util/debug.ts';

type Directive = {
  name: 'import' | 'plugin';
  descriptor: string;
  enabled?: boolean | null;
  allowMissing?: boolean | null;
};

const getStaticString = (node: unknown) =>
  node instanceof ParsedEnvSpecStaticValue && typeof node.value === 'string' ? node.value : undefined;

const getStaticBoolean = (node: unknown) =>
  node instanceof ParsedEnvSpecStaticValue && typeof node.value === 'boolean' ? node.value : undefined;

export const parseVarlockFile = (source: string, filePath?: string) => {
  const directives: Directive[] = [];
  let disabled = false;

  try {
    const file = parseEnvSpecDotEnvFile(source.replace(/^\uFEFF/, '').replace(/^[ \t]+#/gm, '#'));

    for (const decorator of file.decoratorsArray) {
      if (decorator.name === 'disable') disabled ||= decorator.simplifiedValue === true;

      if (decorator.name !== 'plugin' && decorator.name !== 'import') continue;
      const args = decorator.bareFnArgs?.values;
      const descriptor = getStaticString(args?.[0]);
      if (descriptor === undefined) continue;

      const directive: Directive = { name: decorator.name, descriptor };
      for (const arg of args?.slice(1) ?? []) {
        if (!(arg instanceof ParsedEnvSpecKeyValuePair)) continue;
        const value = getStaticBoolean(arg.value);
        if (arg.key === 'enabled') directive.enabled = value ?? null;
        if (arg.key === 'allowMissing') directive.allowMissing = value ?? null;
      }
      directives.push(directive);
    }
  } catch (error) {
    debugLog(
      'Varlock',
      `Unable to parse ${filePath ?? 'env file'} (${error instanceof Error ? error.message : error})`
    );
  }

  return { directives, disabled };
};
