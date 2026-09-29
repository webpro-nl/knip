const local = fileName => `/workspace/${fileName}`;
const origin = (fileName, identifier, position = { line: 1, col: 14 }) => ({
  filePath: local(fileName),
  identifier,
  ...position,
});
const exported = (fileName, identifier, options = {}) => ({
  ...origin(fileName, identifier),
  importLocations: [],
  ...options,
});
const file = (fileName, identifier, details, options) => ({
  exports: [exported(fileName, identifier, options)],
  contention: { [identifier]: details },
});
const site = (kind, fileName, identifier, origins, options = {}) => ({
  kind,
  filePath: local(fileName),
  identifier,
  origins,
  sources: origins.map(origin => origin.filePath),
  ...options,
});

const apples = [origin('fruits.ts', 'apple'), origin('vegetables.ts', 'apple')];
const appleConflicts = [local('fruits.ts'), local('vegetables.ts')];
const appleImports = [origin('index.ts', 'apple', { line: 1, col: 34 })];
const appleBarrel = site('ambiguous', 'barrel.ts', 'apple', apples);

export default {
  'fruits.ts': file(
    'fruits.ts',
    'apple',
    {
      branching: [],
      conflict: appleConflicts,
      sites: [
        appleBarrel,
        site('ambiguous', 'type-barrel.ts', 'apple', apples),
        site('shadowed', 'explicit-barrel.ts', 'apple', [origin('fruits.ts', 'apple')], {
          line: 2,
          col: 10,
          winner: origin('orchard.ts', 'apple'),
        }),
      ],
    },
    { importLocations: appleImports }
  ),
  'barrel.ts': file(
    'barrel.ts',
    'apple',
    {
      branching: [],
      conflict: appleConflicts,
      sites: [appleBarrel],
    },
    { col: 10, importLocations: appleImports }
  ),
  'grove.ts': file('grove.ts', 'cherry', {
    branching: [],
    conflict: [local('grove.ts'), local('orchard.ts')],
    sites: [
      site('shadowed', 'explicit-barrel.ts', 'cherry', [origin('grove.ts', 'cherry')], {
        line: 2,
        col: 10,
        winner: origin('orchard.ts', 'cherry'),
      }),
    ],
  }),
  'diamond-base.ts': file('diamond-base.ts', 'DIAMOND', {
    branching: [local('diamond-top.ts')],
    conflict: [],
    sites: [
      site('converged', 'diamond-top.ts', 'DIAMOND', [origin('diamond-base.ts', 'DIAMOND')], {
        sources: [local('diamond-left.ts'), local('diamond-right.ts')],
      }),
    ],
  }),
  'compote.ts': file('compote.ts', 'compote', {
    branching: [local('preserves.ts')],
    conflict: [],
    sites: [
      site('converged', 'preserves.ts', 'compote', [origin('compote.ts', 'compote')], {
        sources: ['lodash', local('compote.ts')],
      }),
    ],
  }),
  'namespace-barrel.ts': file(
    'namespace-barrel.ts',
    'produce',
    {
      branching: [],
      conflict: [local('grove.ts'), local('orchard.ts')],
      sites: [
        site('ambiguous', 'namespace-barrel.ts', 'produce', [
          origin('orchard.ts', '*', {}),
          origin('grove.ts', 'produce'),
        ]),
      ],
    },
    { col: 15 }
  ),
  'pantry.ts': file(
    'pantry.ts',
    'merge',
    {
      branching: [],
      conflict: [local('utils.ts')],
      sites: [
        site('ambiguous', 'pantry.ts', 'merge', [
          { filePath: 'lodash', identifier: 'merge' },
          origin('utils.ts', 'merge', { line: 3, col: 14 }),
        ]),
      ],
    },
    { col: 15 }
  ),
  'cellar.ts': {
    exports: [exported('cellar.ts', 'jam'), exported('cellar.ts', 'syrup', { line: 2 })],
    contention: {
      jam: { branching: [local('crate.ts')], conflict: [], sites: [] },
      syrup: { branching: [local('crate.ts')], conflict: [local('grove.ts'), local('orchard.ts')] },
    },
  },
  'ferment.ts': file('ferment.ts', 'kimchi', {
    branching: [],
    conflict: [],
    sites: [site('fermented', 'crock.ts', 'kimchi', [origin('brine.ts', 'kimchi')], { line: 3, col: 14 })],
  }),
};
