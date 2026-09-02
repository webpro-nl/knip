import {
  parseEnvSpecDotEnvFile,
  ParsedEnvSpecFunctionCall,
  ParsedEnvSpecKeyValuePair,
  ParsedEnvSpecStaticValue,
} from '@env-spec/parser';

export type Directive = {
  name: 'import' | 'plugin';
  descriptor: string;
  enabled?: boolean;
  allowMissing?: boolean;
};

const getStaticString = (node: unknown) =>
  node instanceof ParsedEnvSpecStaticValue && typeof node.value === 'string' ? node.value : undefined;

const getStaticBoolean = (node: unknown) =>
  node instanceof ParsedEnvSpecStaticValue && typeof node.value === 'boolean' ? node.value : undefined;

export const parseVarlockFile = (source: string) => {
  const directives: Directive[] = [];
  const staticValues = new Map<string, string>();
  let disabled = false;
  let environmentKey: string | undefined;

  try {
    const file = parseEnvSpecDotEnvFile(source);

    for (const decorator of file.decoratorsArray) {
      if (decorator.name === 'disable') disabled ||= decorator.simplifiedValue === true;

      if (decorator.name === 'currentEnv' && decorator.value instanceof ParsedEnvSpecFunctionCall) {
        const value = decorator.value.name === 'ref' ? getStaticString(decorator.value.data.args.values[0]) : undefined;
        if (value !== undefined) environmentKey = value;
      } else if (decorator.name === 'envFlag') {
        environmentKey = getStaticString(decorator.value) ?? environmentKey;
      }

      if (decorator.name !== 'plugin' && decorator.name !== 'import') continue;
      const args = decorator.bareFnArgs?.values;
      const descriptor = getStaticString(args?.[0]);
      if (descriptor === undefined) continue;

      const directive: Directive = { name: decorator.name, descriptor };
      for (const arg of args?.slice(1) ?? []) {
        if (!(arg instanceof ParsedEnvSpecKeyValuePair)) continue;
        const value = getStaticBoolean(arg.value);
        if (value === undefined) continue;
        if (arg.key === 'enabled') directive.enabled = value;
        if (arg.key === 'allowMissing') directive.allowMissing = value;
      }
      directives.push(directive);
    }

    for (const item of file.configItems) {
      const value = getStaticString(item.value);
      if (value !== undefined) staticValues.set(item.key, value);
    }
  } catch {}

  return { directives, disabled, environmentKey, staticValues };
};
