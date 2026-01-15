function fn(a: any, b: any) {
  return import('./return.js');
}

async function asyncFn(a: any) {
  return await import('./awaited-return.js');
}

fn(0, await import('./awaited-fn-arg.js'));

fn(import('./fn-arg.js'), 0);

() => import('./arrow.js');

async () => await import('./awaited-arrow.js');

const obj = {
  key: import('./assignment.js'),
  key2: await import('./awaited-assignment.js'),
  ...(await import('./obj-spread.js')),
};
