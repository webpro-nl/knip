import './side-effects';
import { named as renamed } from './aliased-binding';
import defaultName1, { named as renamed2 } from './default-and-named-binding';
import defaultName2 from './default-identifier';
import { named as renamed3 } from './named-object-binding';

const fn = (_: any) => {};

const topLevel = await import('./top-level-await-import');
const { top } = await import('./top-level-await-import');

const dynamicB = () => import('./dir/import-b').then(m => m.dynamic);

const dynamicF = () => import('./dir/import-f').then(({ dynamic, named: renamed }) => [dynamic, renamed]);

import('./top-level-side-effects-call');

async function main() {
  import('./side-effects-call');
  await import('./await-import-call');
  const { default: defaultName, identifier11: renamedIdentifier, identifier12 } = await import('./object-bindings');

  [defaultName, renamedIdentifier, identifier12];
}

const dynamicImport = (value: string) => {
  return import(`./dir/${value}`);
};

const templateStringExternal = () => {
  return import(`./no-substitution-tpl-literal`);
};

const templateStringLiteral = () => {
  return import('./string-literal');
};

const templateStringInternal = () => {
  return import('./dir/mod');
};

const importMetaResolve = () => {
  return import.meta.resolve('./import-meta-resolve.js');
};

function promiseAll() {
  return {
    async fn() {
      const [identifierA, { default: identifierB }] = await Promise.all([
        import('./import-a'),
        import('./dir/import-b'),
        import('./dir/import-b'),
      ]);

      [identifierA, identifierB];
    },
  };
}

function promiseTail() {
  return {
    async fn() {
      const [, , identifierB] = await Promise.all([
        import('./dir/import-b'),
        import('./dir/import-b'),
        import('./dir/import-b'),
      ]);

      [identifierB];
    },
  };
}

(await import('./prop-access')).propAccess;

const {
  default: defaultName3,
  identifier13: renamedIdentifier,
  identifier14,
} = (await import('./dir/import-b'))['named'];

const defaultName4 = (await import('./default-prop-access')).default;

import('./promise-like').then(f => f).catch(err => err);

const [defaultName5, { default: renamedIdentifier2, namedC }] = await Promise.all([
  import('./import-a'),
  import('./import-c'),
]);

const child1 = fn(() => import('./import-c'));

export default fn({
  components: {
    child1,
    child2: () => import('./import-d'),
    child3: import('./import-e'),
  },
});

[
  topLevel,
  top,
  dynamic,
  defaultName1,
  defaultName2,
  defaultName3,
  defaultName4,
  defaultName5,
  renamed,
  renamed2,
  renamed3,
  renamedIdentifier,
  renamedIdentifier2,
  namedC,
  identifier14,
];
