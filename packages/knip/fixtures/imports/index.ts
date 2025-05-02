import './side-effects';
import { named as renamed } from './aliased-binding.js';
import defaultName1, { named as renamed2 } from './default-and-named-binding.js';
import defaultName2 from './default-identifier.js';
import { named as renamed3 } from './named-object-binding.js';
import type {} from './empty-named-bindings.js';

const fn = (_: any) => {};

const topLevel = await import('./top-level-await-import.js');
const { top } = await import('./top-level-await-import.js');

const dynamicB = () => import('./dir/import-b.js').then(m => m.dynamic);

const dynamicF = () => import('./dir/import-f.js').then(({ dynamic, named: renamed }) => [dynamic, renamed]);

import('./top-level-side-effects-call.js');

async function main() {
  import('./side-effects-call.js');
  await import('./await-import-call.js');
  const { default: defaultName, identifier11: renamedIdentifier, identifier12 } = await import('./object-bindings.js');

  [defaultName, renamedIdentifier, identifier12];
}

const dynamicImport = (value: string) => {
  return import(`./dir/${value}`);
};

const templateStringExternal = () => {
  return import('./no-substitution-tpl-literal.js');
};

const templateStringLiteral = () => {
  return import('./string-literal.js');
};

const templateStringInternal = () => {
  return import('./dir/mod.js');
};

const importMetaResolve = () => {
  return import.meta.resolve('./import-meta-resolve.js');
};

function promiseAll() {
  return {
    async fn() {
      const [identifierA, { default: identifierB }] = await Promise.all([
        import('./import-a.js'),
        import('./dir/import-b.js'),
        import('./dir/import-b.js'),
      ]);

      [identifierA, identifierB];
    },
  };
}

function promiseTail() {
  return {
    async fn() {
      const [, , identifierB] = await Promise.all([
        import('./dir/import-b.js'),
        import('./dir/import-b.js'),
        import('./dir/import-b.js'),
      ]);

      [identifierB];
    },
  };
}

(await import('./prop-access.js')).propAccess;

const {
  default: defaultName3,
  identifier13: renamedIdentifier,
  identifier14,
} = (await import('./dir/import-b.js'))['named'];

const defaultName4 = (await import('./default-prop-access.js')).default;

(await import('./default-prop-access.js'))['elementAccess'];

import('./promise-like').then(f => f).catch(err => err);

const [defaultName5, { default: renamedIdentifier2, namedC }] = await Promise.all([
  import('./import-a.js'),
  import('./import-c.js'),
]);

const child1 = fn(() => import('./import-c.js'));

const { identifier15 } = await import('./catch.js').catch(() => {
  throw new Error('caught');
});

export default fn({
  components: {
    child1,
    child2: () => import('./import-d.js'),
    child3: import('./import-e.js'),
  },
});

[
  topLevel,
  top,
  dynamicB,
  dynamicF,
  defaultName1,
  defaultName2,
  defaultName3,
  defaultName4,
  elementAccess,
  defaultName5,
  renamed,
  renamed2,
  renamed3,
  renamedIdentifier,
  renamedIdentifier2,
  namedC,
  identifier14,
  identifier15,
];
