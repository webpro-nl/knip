import { pickFruit, fetchApi, type Fruit } from '@fixtures/e2e-lib-public-surface';
const x: Fruit = pickFruit('apple');
const r = fetchApi();
x;
r.status;
