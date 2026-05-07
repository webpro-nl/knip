import { pickFruit, fetchApi, type Fruit } from '@fixtures/e2e-lib-typed-exports';
const x: Fruit = pickFruit('apple');
const r = fetchApi();
x;
r.status;
