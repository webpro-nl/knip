import './side-effects';
import { named as renamed } from './aliased-binding.js';
import defaultName1, { named as renamed2 } from './default-and-named-binding.js';
import defaultName2 from './default-identifier.js';
import { named as renamed3 } from './named-object-binding.js';
import type {} from './empty-named-bindings.js';
import * as shared from './scope-static.js';
import { fail as rh } from './then-reject-static.js';
import * as cs from './container-static.js';
import * as as from './alias-static.js';
import * as vt from './var-then-static.js';
import * as ls from './loop-shadow-static.js';

const fn = (_: any) => {};

const wrap = <T extends object>(module: T): T => module;

const topLevel = await import('./top-level-await-import.js');
const { top } = await import('./top-level-await-import.js');

const dynamicB = () => import('./dir/import-b.js').then(m => m.dynamic);

const dynamicF = () => import('./dir/import-f.js').then(({ dynamic, named: renamed }) => [dynamic, renamed]);

const thenMember = () => import('./then-member.js').then(mod => mod.used);

const thenDestructure = () => import('./then-destructure.js').then(({ used }) => used);

const thenNamespaceArg = () => import('./then-namespace-arg.js').then(module => wrap(module));

const thenNamespaceArgMember = () =>
  import('./then-namespace-arg-member.js').then(module => {
    module.init();
    return wrap(module);
  });

const awaitNamespaceArg = async () => {
  const module = await import('./await-namespace-arg.js');
  return wrap(module);
};

const thenNamespaceReturn = () =>
  import('./then-namespace-return.js').then(module => {
    return module;
  });

let assignedNamespace: object = {};
const thenNamespaceAssign = () =>
  import('./then-namespace-assign.js').then(module => {
    assignedNamespace = module;
  });

const thenNamespaceSpread = () => import('./then-namespace-spread.js').then(module => ({ ...module }));

const awaitNamespaceAlias = async () => {
  const module = await import('./await-namespace-alias.js');
  const alias = module;
  return alias;
};

const awaitVarTry = async () => {
  try {
    var v = await import('./await-var-try.js');
  } catch {
    return;
  }
  return v.used;
};

const varNestedInit = async () => {
  try {
    var first = (() => {
        const inner = 1;
        return inner;
      })(),
      second = await import('./var-nested-init.js');
  } catch {
    return;
  }
  return [first, second.used];
};

const thenNamespaceScope = () => import('./then-namespace-scope.js').then(ns => ns.used);

function unrelatedNamespaceParam(ns: object) {
  const copy = ns;
  assignedNamespace = ns;
  assignedNamespace = { ...ns };
  wrap(copy);
  wrap(ns);
  return ns;
}

const scopeTopLevel = await import('./scope-top-level.js');
const useScopeTopLevel = () => scopeTopLevel.used;
function unrelatedTopLevelParam(scopeTopLevel: object) {
  return scopeTopLevel;
}

const scopeNested = () =>
  import('./scope-nested.js').then(module => {
    const inner = (module: object) => wrap(module);
    inner({ used: module.used });
    return module.used;
  });

const scopeShared = () => import('./scope-shared.js').then(shared => shared.used);
const useSharedAfter = () => shared.after;

const shadowBoundary = async () => {
  const q = await import('./shadow-boundary.js');
  function other(q: object) {}q.used;
  return other;
};

const thenRejectArg = () => import('./then-reject-arg.js').then(rh => rh.used, rh);

const shadowDestructured = () =>
  import('./shadow-destructured.js').then(d => {
    d.used;
    {
      const { d } = { d: {} };
      return d;
    }
  });

const shadowClass = () =>
  import('./shadow-class.js').then(k => {
    k.used;
    {
      class k {}
      return k;
    }
  });

const containerStatic = () => cs.used;
const containerDynamic = () =>
  import('./container-dynamic.js').then(cs => {
    const result = { mod: cs };
    return result;
  });

const aliasStatic = () => as.used;
const aliasDynamic = () =>
  import('./alias-dynamic.js').then(as => {
    const alias = as;
    return alias;
  });

var varThen = import('./var-then.js').then(vt => vt.used);
const useVarThenStatic = () => vt.after;

declare const rows: { ls: object; ld: object }[];

function loopShadowStatic() {
  for (const { ls } of rows) wrap(ls);
  return ls.after;
}

const loopShadowDynamic = async () => {
  const ld = await import('./loop-shadow-dynamic.js');
  for (const ld of rows) wrap(ld);
  return ld.used;
};

const forInitShadow = () =>
  import('./for-init-shadow.js').then(m => {
    for (let m = 0; m < 1; m++) wrap(m);
    return m.used;
  });

const switchShadow = (kind: number) =>
  import('./switch-shadow.js').then(m => {
    switch (kind) {
      case 1:
        const m = {};
        return m;
    }
    return m.used;
  });

const containerShadow = () =>
  import('./container-shadow.js').then(m => {
    m.used;
    {
      const m = {};
      const box = { m };
      return box;
    }
  });

const spreadShadow = () =>
  import('./spread-shadow.js').then(m => {
    m.used;
    {
      const m = {};
      const copy = { ...m };
      return copy;
    }
  });

const dynamicG = import('./import-g.js');
dynamicG.then(module => module.func());

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

const [topLevelModule] = await Promise.all([import('./promise-all-top-level.js')]);
topLevelModule.used();

async function loadModules() {
  const [scopedModule] = await Promise.all([import('./promise-all-scoped.js')]);
  return { plugin: scopedModule.used };
}

loadModules();

const tasks = [Promise.resolve({ used() {} })];
const [, spreadNamespace] = await Promise.all([...tasks, import('./promise-all-spread-namespace.js')]);
spreadNamespace.used();
const [, { used: spreadUsed }] = await Promise.all([...tasks, import('./promise-all-spread-named.js')]);
spreadUsed();

const child1 = fn(() => import('./import-c.js'));

const { identifier15 } = await import('./catch.js').catch(() => {
  throw new Error('caught');
});

const importPromise = import('./await-import.js');
const { default: awaitedImport } = await importPromise;
awaitedImport();

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
  thenMember,
  thenDestructure,
  thenNamespaceArg,
  thenNamespaceArgMember,
  awaitNamespaceArg,
  thenNamespaceReturn,
  thenNamespaceAssign,
  thenNamespaceSpread,
  awaitNamespaceAlias,
  awaitVarTry,
  varNestedInit,
  thenNamespaceScope,
  unrelatedNamespaceParam,
  assignedNamespace,
  useScopeTopLevel,
  unrelatedTopLevelParam,
  scopeNested,
  scopeShared,
  useSharedAfter,
  shadowBoundary,
  thenRejectArg,
  shadowDestructured,
  shadowClass,
  containerStatic,
  containerDynamic,
  aliasStatic,
  aliasDynamic,
  varThen,
  useVarThenStatic,
  loopShadowStatic,
  loopShadowDynamic,
  forInitShadow,
  switchShadow,
  containerShadow,
  spreadShadow,
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
