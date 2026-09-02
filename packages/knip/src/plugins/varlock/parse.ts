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

const getStaticValue = (value: unknown): unknown =>
  value instanceof ParsedEnvSpecStaticValue ? value.value : undefined;

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
        const value = decorator.value.name === 'ref' ? getStaticValue(decorator.value.data.args.values[0]) : undefined;
        if (typeof value === 'string') environmentKey = value;
      } else if (decorator.name === 'envFlag') {
        const value = getStaticValue(decorator.value);
        if (typeof value === 'string') environmentKey = value;
      }

      if (decorator.name !== 'plugin' && decorator.name !== 'import') continue;
      const args = decorator.bareFnArgs?.values;
      const descriptor = getStaticValue(args?.[0]);
      if (typeof descriptor !== 'string') continue;

      const directive: Directive = { name: decorator.name, descriptor };
      for (const arg of args?.slice(1) ?? []) {
        if (!(arg instanceof ParsedEnvSpecKeyValuePair)) continue;
        const value = getStaticValue(arg.value);
        if (arg.key === 'enabled' && typeof value === 'boolean') directive.enabled = value;
        if (arg.key === 'allowMissing' && typeof value === 'boolean') directive.allowMissing = value;
      }
      directives.push(directive);
    }

    for (const item of file.configItems) {
      const value = getStaticValue(item.value);
      if (typeof value === 'string') staticValues.set(item.key, value);
    }
  } catch {}

  return { directives, disabled, environmentKey, staticValues };
};
