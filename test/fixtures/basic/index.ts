import { dep } from './dep';

const dynamic = import('./dynamic');

async function main() {
  const { used } = await import('./dynamic');
}

export const b = dep;
