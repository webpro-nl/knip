import type { IsPluginEnabled, Plugin, RegisterVisitors, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toDependency, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createComponentStyleUrlsVisitor } from '../_component-style-urls/component-style-urls-visitor.ts';
import * as karma from '../karma/helpers.ts';
import { getBuilderEntries } from './helpers.ts';
import type { AngularCLIWorkspaceConfiguration, KarmaTarget } from './types.ts';

// https://angular.io/guide/workspace-config

const title = 'Angular';

const enablers = ['@angular/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['angular.json'];

const resolveConfig: ResolveConfig<AngularCLIWorkspaceConfiguration> = async (config, options) => {
  if (!config?.projects) return [];

  const inputs = new Set<Input>();

  for (const project of Object.values(config.projects)) {
    if (!project.architect) continue;
    for (const [targetName, target] of Object.entries(project.architect)) {
      const { options: opts } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (packageName) inputs.add(toDependency(packageName));
      if (opts) {
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
          inputs.add(toConfig('typescript', opts.tsConfig));
        }
      }
      for (const input of getBuilderEntries(targetName, target, options.cwd)) inputs.add(input);
      if (target.builder && isAngularBuilderRefWithName({ builderRef: target.builder, name: 'karma' }) && opts) {
        const karmaBuilderOptions = opts as KarmaTarget;
        // https://github.com/angular/angular-cli/blob/19.0.6/packages/angular_devkit/build_angular/src/builders/karma/schema.json#L143
        const testFilePatterns = karmaBuilderOptions.include ?? ['**/*.spec.ts'];
        for (const testFilePattern of testFilePatterns) {
          inputs.add(toEntry(testFilePattern));
        }
        // https://github.com/angular/angular-cli/blob/19.0.6/packages/angular_devkit/build_angular/src/builders/karma/schema.json#L146
        const excludedTestFilePatterns = karmaBuilderOptions.exclude ?? [];
        for (const excludedTestFilePattern of excludedTestFilePatterns) {
          inputs.add(toEntry(`!${excludedTestFilePattern}`));
        }
        const karmaConfig = karmaBuilderOptions.karmaConfig;
        if (!karmaConfig) {
          // Hardcoded default Karma config from Angular builder
          // https://github.com/angular/angular-cli/blob/19.0.6/packages/angular_devkit/build_angular/src/builders/karma/index.ts#L115
          karma
            .inputsFromPlugins(
              ['karma-jasmine', 'karma-chrome-launcher', 'karma-jasmine-html-reporter', 'karma-coverage'],
              options.manifest.devDependencies
            )
            .forEach(inputs.add, inputs);
          karma.inputsFromFrameworks(['jasmine']).forEach(inputs.add, inputs);
        }
        if (karmaConfig && !karma.configFiles.includes(karmaConfig)) {
          inputs.add(toConfig('karma', karmaConfig));
        }
      }
    }
  }

  return Array.from(inputs);
};

const isAngularBuilderRefWithName = ({ builderRef, name }: { builderRef: string; name: string }) => {
  const [pkg, builderName] = builderRef.split(':');
  return (pkg === '@angular-devkit/build-angular' || pkg === '@angular/build') && builderName === name;
};

const isAngularSpecifier = (specifier: string): boolean => specifier === '@angular/core';

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createComponentStyleUrlsVisitor(ctx, isAngularSpecifier));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  registerVisitors,
};

export default plugin;
