export const quest = Promise.resolve('dragon');

async function embark() {
  const result = await quest;
  return result;
}

export const loot = () => 'gold';

const reward = () => loot;

embark();
reward();
