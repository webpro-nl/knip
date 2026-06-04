export const inventory = ['axe', 'bow', 'crossbow'];

for (const weapon of inventory) {
  weapon;
}

export const armory = { sword: 1, shield: 2 };

for (const slot in armory) {
  slot;
}

export let patrol = true;

while (patrol) {
  patrol = false;
}

export let guard = true;

do {
  guard = false;
} while (guard);
