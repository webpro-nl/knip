import { rs, rstest as rstestApi } from '@rstest/core';
import { add } from '../src/calculator';
import { log } from '../src/logger';

rs.mock(import('../src/calculator'), () => ({ add: () => 0 }));
rstestApi.doMock(import('../src/logger'), () => ({ log: () => '' }));

rs.mock(import('../src/auto-mocked'));
rs.mock(import('../src/spied'), { spy: true });
rs.mock(import('../src/async-factory'), async () => ({}));

const original = {};
rs.mock(import('../src/spread-factory'), () => ({ ...original }));

const registry = { mock: (module: Promise<unknown>) => module };
registry.mock(import('../src/printer'));

function withLocalRs(rs: { mock: (module: Promise<unknown>) => void }) {
  rs.mock(import('../src/reporter'));
}

console.log(add(1, 2), log('done'), withLocalRs);
