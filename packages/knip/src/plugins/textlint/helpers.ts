import { toDependency } from '../../util/input.ts';
import type { Manifest } from '../../util/package-json.ts';

// https://github.com/textlint/textlint/blob/3fd08dc7d6ce40f366bd5a5bb1899fec2892441a/packages/@textlint/config-loader/src/package-prefix.ts

const RULE_PREFIX = 'textlint-rule-';
const PRESET_PREFIX = 'textlint-rule-preset-';
const FILTER_RULE_PREFIX = 'textlint-filter-rule-';
const PLUGIN_PREFIX = 'textlint-plugin-';

// https://github.com/textlint/textlint/blob/3fd08dc7d6ce40f366bd5a5bb1899fec2892441a/packages/@textlint/config-loader/src/textlint-package-name-util.ts#L30-L43
const createFullPackageName = (prefix: string, name: string) => {
  if (name.charAt(0) === '@') {
    const scopedName = name.slice(name.indexOf('/') + 1);
    if (scopedName !== prefix && !scopedName.startsWith(`${prefix}-`)) {
      return name.replace(/^@([^/]+)\/(.*)$/, `@$1/${prefix}$2`);
    }
  }
  return `${prefix}${name}`;
};

const hasPrefix = (prefix: string, name: string) =>
  (name.charAt(0) === '@' ? name.slice(name.indexOf('/') + 1) : name).startsWith(prefix);

const isDeclared = (manifest: Manifest, name: string) =>
  Boolean(
    manifest.dependencies?.[name] ??
    manifest.devDependencies?.[name] ??
    manifest.optionalDependencies?.[name] ??
    manifest.peerDependencies?.[name]
  );

const toPackageDependency = (prefix: string, name: string, candidates: string[], manifest: Manifest) =>
  toDependency(
    candidates.find(candidate => isDeclared(manifest, candidate)) ??
      (hasPrefix(prefix, name) ? name : createFullPackageName(prefix, name))
  );

// https://github.com/textlint/textlint/blob/3fd08dc7d6ce40f366bd5a5bb1899fec2892441a/packages/@textlint/config-loader/src/config-util.ts#L11-L27
const isPresetRuleKey = (key: string) =>
  key.startsWith('preset-') ||
  key.startsWith(PRESET_PREFIX) ||
  (key.charAt(0) === '@' && (key.includes('/preset-') || key.includes(`/${PRESET_PREFIX}`)));

// https://github.com/textlint/textlint/blob/3fd08dc7d6ce40f366bd5a5bb1899fec2892441a/packages/@textlint/config-loader/src/textlint-module-resolver.ts#L156-L218
const toPresetDependency = (key: string, manifest: Manifest) => {
  const name = key.replace(/^preset-/, '').replace(/^@([^/]+)\/preset-(.*)$/, '@$1/$2');
  const candidates = [`${PRESET_PREFIX}${name}`, name, createFullPackageName(PRESET_PREFIX, name), key];
  return toPackageDependency(PRESET_PREFIX, name, candidates, manifest);
};

const toModuleDependency = (prefix: string, key: string, manifest: Manifest) =>
  toPackageDependency(prefix, key, [createFullPackageName(prefix, key), key], manifest);

export const toRuleDependency = (key: string, manifest: Manifest) =>
  isPresetRuleKey(key) ? toPresetDependency(key, manifest) : toModuleDependency(RULE_PREFIX, key, manifest);

export const toFilterRuleDependency = (key: string, manifest: Manifest) =>
  toModuleDependency(FILTER_RULE_PREFIX, key, manifest);

export const toPluginDependency = (key: string, manifest: Manifest) => toModuleDependency(PLUGIN_PREFIX, key, manifest);
