import type { RegisterVisitors } from '../types/config.ts';
import { createJestMockVisitor } from './jest/visitors/mock.ts';
import { createVitestMockVisitor } from './vitest/visitors/mock.ts';
import { createRstestMockVisitor } from './rstest/visitors/mock.ts';
import { createImportMetaGlobVisitor } from './vite/visitors/importMetaGlob.ts';
import { createRequireContextVisitor } from './webpack/visitors/requireContext.ts';
import { createFsPromisesGlobVisitor } from './node/visitors/fsPromisesGlob.ts';
import { createExecaVisitor } from './execa/visitors/execa.ts';
import { createNanoSpawnVisitor } from './nano-spawn/visitors/nano-spawn.ts';
import { createZxVisitor } from './zx/visitors/zx.ts';
import { createKnexClientVisitor } from './knex/visitors/clientCall.ts';
import { createPinoTransportVisitor } from './pino/visitors/transportCall.ts';
import { createCustomElementVisitor } from './_custom-elements/custom-element-visitor.ts';
import { createComponentStyleUrlsVisitor } from './_component-style-urls/component-style-urls-visitor.ts';

const isLitDecoratorsSpecifier = (specifier: string): boolean =>
  specifier === 'lit/decorators.js' ||
  specifier === 'lit/decorators' ||
  specifier.startsWith('lit/decorators/') ||
  specifier === '@lit/reactive-element/decorators.js' ||
  specifier === '@lit/reactive-element/decorators' ||
  specifier.startsWith('@lit/reactive-element/decorators/') ||
  specifier === 'lit-element' ||
  specifier === 'lit-element/decorators.js' ||
  specifier === 'lit-element/decorators' ||
  specifier.startsWith('lit-element/decorators/');

const isFastSpecifier = (specifier: string): boolean => specifier === '@microsoft/fast-element';

const isCatalystSpecifier = (specifier: string): boolean => specifier === '@github/catalyst';

const isStencilSpecifier = (specifier: string): boolean => specifier === '@stencil/core';

const isAngularSpecifier = (specifier: string): boolean => specifier === '@angular/core';

export const referenceVisitorRegistry = new Map<string, RegisterVisitors>([
  [
    'jest',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createJestMockVisitor(ctx));
    },
  ],
  [
    'vitest',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createVitestMockVisitor(ctx));
    },
  ],
  [
    'rstest',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createRstestMockVisitor(ctx));
    },
  ],
  [
    'vite',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createImportMetaGlobVisitor(ctx));
    },
  ],
  [
    'webpack',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createRequireContextVisitor(ctx));
    },
  ],
  [
    'rspack',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createRequireContextVisitor(ctx));
    },
  ],
  [
    'node',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createFsPromisesGlobVisitor(ctx));
    },
  ],
  [
    'execa',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createExecaVisitor(ctx));
    },
  ],
  [
    'nano-spawn',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createNanoSpawnVisitor(ctx));
    },
  ],
  [
    'zx',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createZxVisitor(ctx));
    },
  ],
  [
    'knex',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createKnexClientVisitor(ctx));
    },
  ],
  [
    'pino',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createPinoTransportVisitor(ctx));
    },
  ],
  [
    'lit',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createCustomElementVisitor(ctx, isLitDecoratorsSpecifier));
    },
  ],
  [
    'fast',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createCustomElementVisitor(ctx, isFastSpecifier, { baseClassName: 'FASTElement' }));
    },
  ],
  [
    'catalyst',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createCustomElementVisitor(ctx, isCatalystSpecifier, { decoratorName: 'controller' }));
    },
  ],
  [
    'stencil',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createCustomElementVisitor(ctx, isStencilSpecifier, { decoratorName: 'Component' }));

      registerVisitor(createComponentStyleUrlsVisitor(ctx, isStencilSpecifier));
    },
  ],
  [
    'angular',
    ({ ctx, registerVisitor }) => {
      registerVisitor(createComponentStyleUrlsVisitor(ctx, isAngularSpecifier));
    },
  ],
]);
